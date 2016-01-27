var fs = require('fs');
var es = require('event-stream');
var parseFast = require('../lib/parse');
var Schema = require('../lib').Schema;
var connect = require('mongodb');
var format = require('util').format;

// var debug = require('debug')('mongodb-schema:bin');

var argv = require('yargs')
  .strict()
  .usage('Usage: $0 [options] <source>')
  .example('$0 -n 1000 -d my -c coll', 'analyzes 1000 documents from the `my.coll` namespace.')
  .example('$0 --fast -f docs.json', 'analyzes file `docs.json` using the fast parser.')
  .wrap(100)

  // --file
  .option('f', {
    alias: 'file',
    describe: 'json file to analyze.'
  })

  // --database
  .option('d', {
    describe: 'database of a running MongoDB instance. requires -c.',
    implies: 'c',
    alias: 'database'
  })

  // --collection
  .describe('c', 'collection of a running MongoDB instance. requires -d.')
  .implies('c', 'd')
  .alias('c', 'collection')

  // --port
  .describe('p', 'port of a running MongoDB instance. requires -d and -c')
  .alias('p', 'port')
  .default('p', 27017)

  // --number
  .describe('n', 'number of documents to be sampled from a collection.')
  .default('n', 100)
  .alias('n', 'number')

  // --fast
  .describe('fast', 'use fast analysis algorithm.')
  .boolean('fast')

  // --stdout
  .describe('stdout', 'print resulting schema to stdout')
  .boolean('stdout')

  // --stats
  .describe('stats', 'print schema statistics to stdout')
  .boolean('stats')

  .check(function(argv) {
    if (argv.f === undefined && argv.d === undefined) {
      throw new Error('source required: either provide a json file (-f), or'
        + ' a database (-d) and collection (-c).');
    }
    return true;
  })
  .argv;

// var debug = require('debug')('gold-standard');
var ts;
var dur;

var pipeToOutput = function(inputStream) {
  ts = new Date();
  var schema;

  if (argv.fast) {
    inputStream = parseFast(inputStream)
      .pipe(es.map(function(res, cb) {
        schema = new Schema(res, {
          parse: true
        });
        cb();
      }));
  } else {
    schema = new Schema();
    inputStream = inputStream
      .pipe(schema.stream());
  }
  return inputStream
    .on('end', function() {
      dur = new Date() - ts;
      if (argv.stdout) {
        console.log(JSON.stringify(schema.serialize(), null, ' '));
      }
      console.log('time: ' + dur + 'ms.');
      if (argv.stats) {
        console.log('toplevel fields:', schema.fields.length);
        console.log('branching factors: %j', schema.branchingFactors);
        console.log('schema width: ' + schema.width);
        console.log('schema depth: ' + schema.depth);
      }
    });
};

if (argv.file) {
  var inputStream = fs.createReadStream(argv.file, {
    flags: 'r'
  })
    .pipe(es.split())
    .pipe(es.parse());

  pipeToOutput(inputStream);
} else {
  connect(format('mongodb://localhost:%s/%s', argv.port, argv.database), function(err, db) {
    if (err) {
      throw console.error(err);
    }
    var inputStream = db.collection(argv.collection).find()
      .limit(Number(argv.number))
      .stream();

    pipeToOutput(inputStream)
      .on('end', function() {
        db.close();
      });
  });
}
