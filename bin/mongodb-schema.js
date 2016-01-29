#!/usr/bin/env node

var es = require('event-stream');
var Schema = require('../').Schema;
var mongodb = require('mongodb');
var sample = require('mongodb-collection-sample');
var toNS = require('mongodb-ns');
var yaml = require('js-yaml');
var pkg = require('../package.json');
var Table = require('cli-table');
var numeral = require('numeral');
var EJSON = require('mongodb-extended-json');

// var debug = require('debug')('mongodb-schema:bin');

var argv = require('yargs')
  .strict()
  .usage('Usage: $0 <uri> <ns> [--format=<json|yaml|table> --sample=<n>]')
  .demand(2)
  .option('n', {
    alias: 'sample',
    default: 100,
    describe: 'The number of documents to sample.'
  })
  .option('f', {
    alias: 'format',
    default: 'json',
    describe: 'The output format.',
    choices: ['json', 'yaml', 'table']
  })
  .option('o', {
    alias: 'output',
    type: 'boolean',
    describe: 'Print the computed schema to stdout.',
    default: true
  })
  .describe('fast', 'use fast analysis algorithm.')
  .boolean('fast')
  .describe('stats', 'print schema statistics to stdout')
  .boolean('stats')
  .describe('debug', 'Enable debug messages.')
  .describe('version', 'Show version.')
  .alias('h', 'help')
  .describe('h', 'Show this screen.')
  .help('h')
  .wrap(100)
  .argv;

if (argv.debug) {
  process.env.DEBUG = '*';
}

var uri = argv._[0];
if (!uri.startsWith('mongodb://')) {
  uri = 'mongodb://' + uri;
}
var sampleSize = parseInt(argv.sample, 10);

if (argv.version) {
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

  if (field.arrayFields) {
    field.arrayFields.map(function(child) {
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

mongodb.connect(uri, function(err, conn) {
  if (err) {
    console.error('Failed to connect to MongoDB: ', err);
    process.exit(1);
  }

  var ns = toNS(argv._[1]);
  var db = conn.db(ns.database);
  var schema = new Schema();
  var ts;

  var options = {
    size: sampleSize,
    query: {}
  };

  sample(db, ns.collection, options)
    .once('data', function() {
      ts = new Date();
    })
    .pipe(schema.stream(argv.fast))
    .pipe(es.wait(function(err) {
      if (err) {
        console.error('Error generating schema:', err);
        process.exit(1);
      }
      var dur = new Date() - ts;
      if (argv.output) {
        var output = '';
        if (argv.format === 'yaml') {
          output = yaml.dump(schema.serialize());
        } else if (argv.format === 'table') {
          output = getTable(schema).toString();
        } else {
          output = EJSON.stringify(schema.serialize(), null, 2);
        }
        console.log(output);
      }

      if (argv.stats) {
        console.error('time: ' + dur + 'ms');
        console.error('toplevel fields:', schema.fields.length);
        console.error('branching factors: %j', schema.branchingFactors);
        console.error('schema width: ' + schema.width);
        console.error('schema depth: ' + schema.depth);
      }

      process.exit(0);
    }));
});
