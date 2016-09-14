var getSchema = require('../');
var assert = require('assert');
var _ = require('lodash');

describe('mixed type probability', function() {
  var docs = [
    {
      _id: 1,
      registered: 1
    },
    {
      _id: 2,
      registered: '1'
    },
    {
      _id: 3,
      registered: true
    },
    {
      _id: 4,
      assigned: true
    }
  ];

  var schema;
  var registered;
  before(function(done) {
    getSchema(docs, function(err, res) {
      assert.ifError(err);
      schema = res;
      registered = _.find(schema.fields, 'name', 'registered');

      if (!registered) {
        return done(new Error('Did not pick up `registered` field'));
      }
      if (!_.find(registered.types, 'name', 'Undefined')) {
        return done(new Error('Missing Undefined type on `registered`'));
      }
      done();
    });
  });
  it('should have 4 types for `registered`', function() {
    assert.equal(registered.types.length, 4);
  });
  it('should have a probability of 25% for `registered` to be a boolean', function() {
    assert.equal(_.find(registered.types, 'name', 'Boolean').probability, 1 / 4);
  });
  it('should have a probability of 25% for `registered` to be a number', function() {
    assert.equal(_.find(registered.types, 'name', 'Number').probability, 1 / 4);
  });
  it('should have a probability of 25% for `registered` to be a string', function() {
    assert.equal(_.find(registered.types, 'name', 'String').probability, 1 / 4);
  });
  it('should have a probability of 25% for `registered` to be undefined', function() {
    assert.equal(_.find(registered.types, 'name', 'Undefined').probability, 1 / 4);
  });
  it('should compensate for missed Undefined values', function() {
    var assigned = _.find(schema.fields, 'name', 'assigned');
    assert.equal(assigned.probability, 0.25);
    assert.equal(_.find(assigned.types, 'name', 'Boolean').probability, 0.25);
  });
});
