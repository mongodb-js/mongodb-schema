var parseSchema = require('../');
var connect = require('mongodb');

connect('mongodb://localhost:27017/mongodb', function(err, db) {
  if (err) {
    return console.error(err);
  }
  var ts = new Date();
  parseSchema('perf.test', db.collection('fanclub').find().limit(1000), function(err, schema) {
    if (err) {
      return console.error(err);
    }
    var dur = new Date() - ts;
    console.log(JSON.stringify(schema, null, 2));
    console.log('took ' + dur + 'ms');
    db.close();
  });
});
