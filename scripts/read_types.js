// script to read documents from the test.types collection created by `write_types.js`

var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');

var url = 'mongodb://localhost:27017/test';

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);

  // Get the documents collection
  var collection = db.collection('types');

  // find all documents and print them out
  collection.find({}).toArray(function(err, docs) {
    assert.equal(err, null);

    console.log(JSON.stringify(docs, null, 2));
    db.close();

  });
});
