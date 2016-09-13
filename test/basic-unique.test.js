var getSchema = require('../');
var assert = require('assert');
var _ = require('lodash');

// var debug = require('debug')('mongodb-schema:test:unique');

describe('has_duplicates', function() {
  var docs = _.map(_.range(11111), function(val) {
    return {
      num: val,
      str: String(val)
    };
  });

  var schema;
  before(function(done) {
    getSchema(docs, function(err, res) {
      assert.ifError(err);
      schema = res;
      done();
    });
  });

  it('should not have duplicates', function() {
    assert.equal(_.find(schema.fields, 'name', 'num').has_duplicates, false);
  });

  it('should have 10000 number values for the `num` field', function() {
    assert.equal(_.find(_.find(schema.fields, 'name', 'num').types,
      'name', 'Number').values.length, 10000);
  });

  it('should have 100 string values for the `str` field', function() {
    assert.equal(_.find(_.find(schema.fields, 'name', 'str').types,
      'name', 'String').values.length, 100);
  });
});

describe('unique', function() {
  var docs = [
    {
      _id: 1,
      registered: true,
      b: false
    },
    {
      _id: 2,
      registered: true,
      code: null,
      b: 'false'
    },
    {
      _id: 3,
      code: null
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
    assert.equal(_.find(schema.fields, 'name', '_id').count, 3);
  });

  it('should have unique of 3 for `_id`', function() {
    assert.equal(_.find(schema.fields, 'name', '_id').unique, 3);
    assert.equal(_.find(_.find(schema.fields, 'name', '_id').types,
      'name', 'Number').unique, 3);
  });

  it('should not have duplicates for `_id`', function() {
    assert.equal(schema.fields.get('_id').has_duplicates, false);
  });

  it('should have count of 2 for `registered`', function() {
    assert.equal(_.find(schema.fields, 'name', 'registered').count, 2);
  });

  it('should have unique of 1 for `registered` type Boolean', function() {
    assert.equal(schema.fields.get('registered').types.get('Boolean').unique, 1);
  });

  it('should have unique of 1 for `registered` overall', function() {
    assert.equal(schema.fields.get('registered').unique, 1);
  });

  it('should return unique of 0 for Undefined type', function() {
    assert.equal(schema.fields.get('registered').types.get('Undefined').unique, 0);
  });

  it('should have unique of 1 for `code`', function() {
    assert.equal(schema.fields.get('code').types.get('Null').unique, 1);
  });

  it('should not have duplicate values for b', function() {
    assert.equal(schema.fields.get('b').has_duplicates, false);
  });

  it('should have duplicates for `registered`', function() {
    assert.equal(schema.fields.get('registered').has_duplicates, true);
  });
});
