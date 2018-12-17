/* eslint no-console: 0 */

const parseSchema = require('../');
const MongoClient = require('mongodb').MongoClient;
const dbName = 'mongodb';

MongoClient.connect(`mongodb://localhost:27017/${dbName}`, function(err, client) {
  if (err) {
    return console.error(err);
  }

  const db = client.db(dbName);

  parseSchema(db.collection('fanclub').find().limit(100), function(err2, schema) {
    if (err2) {
      return console.error(err);
    }

    console.log(JSON.stringify(schema, null, 2));
    client.close();
  });
});
