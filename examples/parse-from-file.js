var Schema = require('../lib/schema');
var fs = require('fs');
var es = require('event-stream');

var ts = new Date();

// create new schema object with fake namespace
var schema = new Schema({
  ns: 'perf.testing'
});

fs.createReadStream('./fanclub.json', {
  flags: 'r'
})
  .pipe(es.split()) // split file into individual json docs (one per line)
  .pipe(es.parse()) // parse each doc
  .pipe(schema.stream()) // comment out this line to skip schema parsing
  .pipe(es.stringify()) // stringify result
  .pipe(es.wait(function(err, res) { // assemble everything back together
    if (err) {
      throw err;
    }
    var dur = new Date() - ts;
    console.log(res);
    console.log('took ' + dur + 'ms.'); // log time it took to parse
  }));
