/* eslint new-cap: 0 */
var getSchema = require('../');
var assert = require('assert');
var bson = require('bson');

// var debug = require('debug')('mongodb-schema:test:unique');

describe('has_duplicates', function() {
  var docs = [];
  for (let i = 0; i <= 11111; i++) {
    docs.push({
      num: i,
      str: String(i)
    })
  }

  var schema;
  before(function(done) {
    getSchema(docs, function(err, res) {
      assert.ifError(err);
      schema = res;
      done();
    });
  });

  it('should not have duplicates', function() {
    assert.equal(schema.fields.find(v => v.name === 'num').has_duplicates, false);
  });

  it('should have 10000 number values for the `num` field', function() {
    var types = schema.fields.find(v => v.name === 'num').types;
    assert.equal(types.find(v => v.name === 'Number').values.length, 10000);
  });

  it('should have 100 string values for the `str` field', function() {
    var types = schema.fields.find(v => v.name === 'str').types;
    assert.equal(types.find(v => v.name === 'String').values.length, 100);
  });
});

describe('unique', function() {
  var docs = [
    {
      _id: 1,
      registered: true,
      b: false,
      int32: bson.Int32(5),
      date: new Date('2016-01-01')
    },
    {
      _id: 2,
      registered: true,
      code: null,
      b: 'false',
      int32: bson.Int32(5),
      date: new Date('2016-01-01')
    },
    {
      _id: 3,
      code: null,
      int32: bson.Int32(9),
      date: new Date('2011-11-11')
    }
  ];

  var schema;
  before(function(done) {
    getSchema(docs, function(err, res) {
      assert.ifError(err);
      schema = res;
      done();
    });
  });

  it('should have count of 3 for `_id`', function() {
    assert.equal(schema.fields.find(v => v.name === '_id').count, 3);
  });

  it('should have unique of 3 for `_id`', function() {
    var types = schema.fields.find(v => v.name === '_id').types;
    assert.equal(types.find(v => v.name === 'Number').unique, 3);
  });

  it('should not have duplicates for `_id`', function() {
    assert.equal(schema.fields.find(v => v.name === '_id').has_duplicates, false);
  });

  it('should have count of 2 for `registered`', function() {
    assert.equal(schema.fields.find(v => v.name === 'registered').count, 2);
  });

  it('should have unique of 1 for `registered` type Boolean', function() {
    var types = schema.fields.find(v => v.name === 'registered').types;
    assert.equal(types.find(v => v.name === 'Boolean').unique, 1);
  });

  it('should have unique of 1 for `code`', function() {
    var types = schema.fields.find(v => v.name === 'code').types;
    assert.equal(types.find(v => v.name === 'Null').unique, 1);
  });

  it('should have unique of 2 for `int32`', function() {
    var types = schema.fields.find(v => v.name === 'int32').types;
    assert.equal(types.find(v => v.name === 'Int32').unique, 2);
  });

  it('should have unique of 2 for `date`', function() {
    var types = schema.fields.find(v => v.name === 'date').types;
    assert.equal(types.find(v => v.name === 'Date').unique, 2);
  });

  it('should not have duplicate values for b', function() {
    assert.equal(schema.fields.find(v => v.name === 'b').has_duplicates, false);
  });

  it('should have duplicates for `registered`', function() {
    assert.equal(schema.fields.find(v => v.name === 'registered').has_duplicates, true);
  });
});
