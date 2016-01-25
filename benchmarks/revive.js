var fs = require('fs');
var es = require('event-stream');
var parseSchema = require('../lib/parse');
var connect = require('mongodb');

var Schema = require('../lib/schema');

// var debug = require('debug')('mongodb-schema:revive');

var output = es.through(function write(data) {
  // console.log(JSON.stringify(data));
  var schema = new Schema(data, {
    parse: true
  });
  console.log(JSON.stringify(schema.serialize()));
  this.emit('data', schema);
});

if (process.argv.length < 3) {
  console.log('Usage: \n  node gold-standard.js <jsonfile>\n'
    + '  node gold-standard.js <db> <coll> [<limit>]');
  process.exit(1);
} else if (process.argv.length === 3) {
  var inputStream = fs.createReadStream(process.argv[2], {
    flags: 'r'
  })
    .pipe(es.split())
    .pipe(es.parse());

  parseSchema(inputStream)
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
      .pipe(output)
      .on('end', function() {
        db.close();
      });
  });
}
