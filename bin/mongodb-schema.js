#!/usr/bin/env node

var path = require('path');
var fs = require('fs');
/*eslint no-sync:0*/
var usage = fs.readFileSync(path.resolve(__dirname, '../usage.txt')).toString();
var args = require('minimist')(process.argv.slice(2), {
  boolean: ['debug']
});

if (args.debug) {
  process.env.DEBUG = '*';
}

var es = require('event-stream');
var Schema = require('../').Schema;
var mongodb = require('mongodb');
var sample = require('mongodb-collection-sample');
var toNS = require('mongodb-ns');
var EJSON = require('mongodb-extended-json');
var yaml = require('js-yaml');
var pkg = require('../package.json');
var Table = require('cli-table');
var numeral = require('numeral');

args.uri = args._[0];
args.ns = args._[1];
args.size = parseInt(args.size || 100, 10);
args.format = args.format || 'json';

if (args.help || args.h || !args.uri || !args.ns) {
  console.error(usage);
  process.exit(1);
}

if (args.version) {
  console.error(pkg.version);
  process.exit(1);
}

function addTableRow(table, field) {
  table.push([
    field.path,
    field.type,
    numeral(field.probability).format('0.000%')
  ]);

  if (field.fields) {
    field.fields.map(function(child) {
      addTableRow(table, child);
    });
  }
}

function getTable(schema) {
  var table = new Table({
    head: ['Path', 'Type', 'Probability'],
    colWidths: [50, 30, 20]
  });
  schema.fields.map(function(field) {
    addTableRow(table, field);
  });
  return table;
}

mongodb.connect(args.uri, function(err, conn) {
  if (err) {
    console.error('Failed to connect to MongoDB: ', err);
    process.exit(1);
  }

  var ns = toNS(args.ns);
  var db = conn.db(ns.database);

  var schema = new Schema({
    ns: args.ns
  });

  var options = {
    size: args.size,
    query: {}
  };

  sample(db, ns.collection, options)
    .pipe(schema.stream())
    .pipe(es.wait(function(err) {
      if (err) {
        console.error('Error generating schema:', err);
        process.exit(1);
      }

      var output = '';
      if (args.format === 'yaml') {
        output = yaml.dump(schema.serialize());
      } else if (args.format === 'table') {
        output = getTable(schema).toString();
      } else {
        output = EJSON.stringify(schema.serialize(), null, 2);
      }

      console.log(output);
      process.exit(0);
    }));
});
