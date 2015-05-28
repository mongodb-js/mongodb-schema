var getSchema = require('../');
var assert = require('assert');
var _ = require('lodash');

describe('mixed type order', function() {
  var docs = [
    {
      _id: 2
    },
    {
      _id: 3,
      registered: '1'
    },
    {
      _id: 4,
      registered: '1'
    },
    {
      _id: 1,
      registered: 1
    }
  ];

  var schema;
  before(function(done) {
    schema = getSchema('type.order', docs, function(err) {
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
  it('should have 3 types for `registered`', function() {
    assert.equal(schema.fields.get('registered').types.length, 3);
  });
  it('should return the order of types as ["String", "Number", "Undefined"]', function(done) {
    assert.deepEqual(schema.fields.get('registered').types.pluck('_id'), ['String', 'Number', 'Undefined']);
    done();
  });
});
