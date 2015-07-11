var getSchema = require('../');
var assert = require('assert');

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
  before(function(done) {
    schema = getSchema('probability', docs, function(err) {
      if (err) return done(err);
      if (!schema.fields.get('registered')) {
        return done(new Error('Did not pick up `registered` field'));
      }
      if (!schema.fields.get('registered').types.get('Undefined')) {
        return done(new Error('Missing Undefined type on `registered`'));
      }
      done();
    });
  });
  it('should have 4 types for `registered`', function() {
    assert.equal(schema.fields.get('registered').types.length, 4);
  });
  it('should have a probability of 25% for `registered` to be a boolean', function() {
    assert.equal(schema.fields.get('registered').types.get('Boolean').probability, 1 / 4);
  });
  it('should have a probability of 25% for `registered` to be a number', function() {
    assert.equal(schema.fields.get('registered').types.get('Number').probability, 1 / 4);
  });
  it('should have a probability of 25% for `registered` to be a string', function() {
    assert.equal(schema.fields.get('registered').types.get('String').probability, 1 / 4);
  });
  it('should have a probability of 25% for `registered` to be undefined', function() {
    assert.equal(schema.fields.get('registered').types.get('Undefined').probability, 1 / 4);
  });
  it('should compensate for missed Undefined values', function() {
    assert.equal(schema.fields.get('assigned').probability, 0.25);
    assert.equal(schema.fields.get('assigned').types.get('Boolean').probability, 0.25);
  });
});
