#!/usr/bin/env node

var Schema = require('../').Schema;
var mongodb = require('mongodb');
var sample = require('mongodb-collection-sample');
var toNS = require('mongodb-ns');
var yaml = require('js-yaml');
var pkg = require('../package.json');
var Table = require('cli-table');
var numeral = require('numeral');
var EJSON = require('mongodb-extended-json');
var ProgressBar = require('progress');
var async = require('async');
var stats = require('stats-lite');

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
  .option('r', {
    alias: 'repeat',
    type: 'number',
    describe: 'Repeat experiment n times.',
    default: 1
  })
  .option('s', {
    alias: 'stats',
    type: 'boolean',
    describe: 'print schema statistics to stderr'
  })
  .option('native', {
    type: 'boolean',
    describe: 'use native (fast) analysis algorithm',
    default: true
  })
  .describe('debug', 'Enable debug messages.')
  .describe('version', 'Show version.')
  .alias('h', 'help')
  .describe('h', 'Show this screen.')
  .help('h')
  .wrap(100)
  .example('$0 localhost:27017 mongodb.fanclub --sample 1000 --repeat 5 --stats '
    + '--no-output --no-native', 'analyze 1000 docs from the mongodb.fanclub '
    + 'collection with the old ampersand parser, repeat 5 times and only show statistics.')
  .example('$0 localhost:27017 test.foo --format table',
    'analyze 100 docs from the test.foo collection and print '
    + 'the schema in table form.')
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

var bar = new ProgressBar('analyzing [:bar] :percent :etas ', {
  total: argv.sample * argv.repeat,
  width: 60,
  complete: '=',
  incomplete: ' ',
  clear: true
});

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

  async.timesSeries(argv.repeat, function(arr, cb) {
    sample(db, ns.collection, options)
      .once('data', function() {
        ts = new Date();
      })
      .pipe(schema.stream(argv.native))
      .on('progress', function() {
        bar.tick();
      })
      .on('end', function() {
        var dur = new Date() - ts;
        cb(null, dur);
      });
  }, function(err, res) {
    if (err) {
      console.error('error:', err.message);
      process.exit(1);
    }
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
      console.error('execution count: ' + argv.repeat);
      console.error('mean time: ' + numeral(stats.mean(res))
          .format('0.00') + 'ms (individual results: %s)', res.toString());
      console.error('stdev time: ' + numeral(stats.stdev(res)).format('0.00') + 'ms');
      console.error('toplevel fields:', schema.fields.length);
      console.error('branching factors: %j', schema.branchingFactors);
      console.error('schema width: ' + schema.width);
      console.error('schema depth: ' + schema.depth);
    }
    conn.close();
  });
});
