var parseSchema = require('../');
var connect = require('mongodb');

connect('mongodb://localhost:27017/test', function(err, db) {
  if (err) return console.error(err);

  parseSchema('test.test', db.collection('test').find(), function(err, schema) {
    if (err) return console.error(err);

    console.log(JSON.stringify(schema, null, 2));
    db.close();
  });
});
