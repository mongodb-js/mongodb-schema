/* eslint no-console: 0 */

var parseSchema = require('../');
var connect = require('mongodb');

connect('mongodb://localhost:27017/mongodb', function(err, db) {
  if (err) {
    return console.error(err);
  }

  parseSchema(db.collection('fanclub').find().limit(100), function(err2, schema) {
    if (err2) {
      return console.error(err);
    }

    console.log(JSON.stringify(schema, null, 2));
    db.close();
  });
});
