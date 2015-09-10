var getSchema = require('../');
var assert = require('assert');
var BSON = require('bson');
var EJSON = require('mongodb-extended-json');

/*eslint new-cap: 0, quote-props: 0*/
describe('jeff\'s docs', function() {
  var schema;
  var docs = [
    {
      '_id': BSON.ObjectID('55e6484748f15136d28b6e76')
    },
    {
      '_id': BSON.ObjectID('55f0a1ca62510c0b042b59e8'),
      'arr1': [1, 2, 3],
      'arr2': [true, false],
      'arr3': [{ 'c': 1, 'd': 2 }, { 'c': 1, 'e': 3 }, { 'e': 3 }],
      'doc': { 'a': 1, 'b': 2 },
      'x': 1
    },
    {
      '_id': BSON.ObjectID('55f0a1ca62510c0b042b59e9'),
      'arr1': [1, 2, 3],
      'arr2': [true, false],
      'arr3': [{ 'c': 1, 'd': 2 }, { 'c': 1, 'e': 3 }, { 'e': 3 }],
      'doc': { 'a': 1, 'b': 2 },
      'x': 1
    },
    {
      '_id': BSON.ObjectID('55f0a1ca62510c0b042b59ea'),
      'arr1': [1, 2, 3],
      'arr2': [true, false],
      'arr3': [{ 'c': 1, 'd': 2 }, { 'c': 1, 'e': 3 }, { 'e': 3 }],
      'doc': { 'a': 1, 'b': 2 },
      'x': 1
    }
  ];

  before(function(done) {
    schema = getSchema('jeff', docs, function() {
      done();
    });
  });
  it('should be able to serialize these docs in JSON and EJSON', function() {
    assert.ok(JSON.stringify(schema.serialize()));
    assert.ok(EJSON.stringify(schema.serialize()));
  });
});
