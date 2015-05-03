// script to read documents from the test.types collection created by `write_types.js`
var BSON = require('bson').BSONPure.BSON;

var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');

var url = 'mongodb://localhost:27017/test';


MongoClient.connect(url, function(err, db) {
  assert.ifError(err);

  // Get the documents collection
  var collection = db.collection('types', {raw: false});

  // find all documents and print them out
  collection.find({}).sort({btype:1}).toArray(function(err, docs) {
    assert.ifError(err);

    // don't use JSON.stringify here, it loses a lot of information like _bsontype
    docs.forEach(function (doc) {
      console.log(doc.x, doc.btype, doc.comment);
      console.log()
      // console.log(BSON.deserialize(doc));
    });
    db.close();
  });
});

