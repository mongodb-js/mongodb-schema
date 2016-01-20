var Schema = require('../lib/schema');
var fs = require('fs');
var ms = require('ms');
var es = require('event-stream');
var Benchmark = require('benchmark');

var argv = require('yargs')
  .usage('Usage: $0 [--compute-schema] <jsonfile(s)>')
  .alias('c', 'compute-schema')
  .boolean('c')
  .describe('c', 'Only computes the schema if this flag is present.')
  .demand(1)
  .argv;

var suite = new Benchmark.Suite();

var identityStream = function() {
  return es.map(function(data, cb) {
    cb(null, data);
  });
};

var addTestCase = function(testName, fileName) {
  if (!fileName) {
    fileName = testName;
  }
  suite.add(testName, {
    defer: true,
    fn: function(deferred) {
      var schema = new Schema({
        ns: 'perf.testing'
      });
      var processStream = argv.c ? schema.stream() : identityStream();
      fs.createReadStream(fileName, {
        flags: 'r'
      })
        .pipe(es.split()) // split file into individual JSON docs (one per line)
        .pipe(es.parse()) // parse each doc
        .pipe(processStream) // either do nothing or compute the schema
        .pipe(es.stringify()) // stringify result
        .pipe(es.wait(function(err) { // assemble everything back together
          if (err) {
            console.log(err);
            throw err;
          }
          deferred.resolve();
        }));
    }
  });
};

// Add a test to the suite for each input JSON file.
for (var i = 0; i < argv._.length; i++) {
  addTestCase(argv._[i]);
}

var prettyTime = function(seconds) {
  var timeMS = Math.round(seconds * 1000 * 1000) / 1000;
  return ms(timeMS, {
    long: true
  });
};

suite.on('complete', function() {
  this.map(function(test) {
    console.log('Stats for test:', test.name);
    console.log('  Mean:    ', prettyTime(test.stats.mean));
    console.log('  Variance:', prettyTime(test.stats.variance));
    console.log('');
  });
}).run({
  initCount: 5, // 5 runs
  maxTime: 60 // 1 minute
});
