var getSchema = require('../');
var assert = require('assert');
var _ = require('lodash');

describe('mixed types nested', function() {
  var docs = [
    {
      _id: 1,
      address: {
        valid: 0
      }
    },
    {
      _id: 2,
      address: {
        valid: false
      }
    },
    {
      _id: 3,
      address: {
        valid: 'None'
      }
    },
    {
      _id: 4,
      address: {}
    },
    {
      _id: 5,
      address: {
        valid: true
      }
    }
  ];

  var schema;
  var valid;

  before(function(done) {
    getSchema(docs, function(err, res) {
      assert.ifError(err);
      schema = res;
      if (!_.find(schema.fields, 'name', '_id')) {
        return done(new Error('Did not pick up `_id` field'));
      }
      valid = _.find(_.find(_.find(schema.fields, 'name', 'address').types,
        'name', 'Document').fields, 'name', 'valid');
      if (!valid) {
        return done(new Error('Did not pick up `address.valid` field'));
      }
      if (!_.find(valid.types, 'name', 'Undefined')) {
        return done(new Error('Missing Undefined type on `address.valid`'));
      }
      done();
    });
  });

  it('should see the `address` field is always present', function() {
    assert.equal(_.find(schema.fields, 'name', 'address').probability, 1);
  });
  it('should see the `valid` field in 80% of documents', function() {
    assert.equal(valid.probability, 0.8);
  });
  it('should see there are 4 possible types for `valid`', function() {
    assert.equal(valid.types.length, 4);
  });
  it('should see `Number` was used in 20% of documents', function() {
    assert.equal(_.find(valid.types, 'name', 'Number').probability, 0.2);
  });
  it('should see `Boolean` was used in 40% of documents', function() {
    assert.equal(_.find(valid.types, 'name', 'Boolean').probability, 0.4);
  });
  it('should see `Undefined` was used in 20% of documents', function() {
    assert.equal(_.find(valid.types, 'name', 'Undefined').probability, 0.2);
  });
  it('should see `String` was used in 20% of documents', function() {
    assert.equal(_.find(valid.types, 'name', 'String').probability, 0.2);
  });
});
