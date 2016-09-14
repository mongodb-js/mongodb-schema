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

  var registered;
  before(function(done) {
    getSchema(docs, function(err, schema) {
      assert.ifError(err);
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
  it('should have 3 types for `registered`', function() {
    assert.equal(registered.types.length, 3);
  });
  it('should return the order of types as ["String", "Number", "Undefined"]', function(done) {
    assert.deepEqual(_.pluck(registered.types, 'name'),
      ['String', 'Number', 'Undefined']);
    done();
  });
});
