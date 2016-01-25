var fs = require('fs');
var es = require('event-stream');
var parseSchema = require('../lib/parse');
var connect = require('mongodb');

// var debug = require('debug')('gold-standard');

var ts = new Date();

var output = es.wait(function(err, res) {
  if (err) {
    throw err;
  }
  var dur = new Date() - ts;
  console.log(res);
  console.log('took ' + dur + 'ms.');
});

if (process.argv.length < 3) {
  console.log('Usage: \n  node gold-standard.js <jsonfile>\n'
    + '  node gold-standard.js <db> <coll> [<limit>]');
  process.exit(1);
} else if (process.argv.length === 3) {
  var inputStream = fs.createReadStream(process.argv[2], {
    flags: 'r'
  });
  parseSchema(inputStream)
    .pipe(es.stringify()) // stringify result
    .pipe(output);
} else if (process.argv.length > 3) {
  connect('mongodb://localhost:27017/test', function(err, db) {
    if (err) {
      throw console.error(err);
    }
    var inputStream = db.db(process.argv[2])
      .collection(process.argv[3])
      .find()
      .limit(Number(process.argv[4]) || 100)
      .stream();

    parseSchema(inputStream)
      .pipe(es.stringify()) // stringify result
      .pipe(output)
      .on('end', function() {
        db.close();
      });
  });
}
