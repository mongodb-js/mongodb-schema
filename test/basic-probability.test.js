var getSchema = require('../');
var assert = require('assert');

describe('simple probability', function() {
  var docs = [
    {
      _id: 1,
      registered: true
    },
    {
      _id: 2
    }
  ];

  var schema;
  before(function(done) {
    schema = getSchema('probability', docs, function(err) {
      if (err) {
        return done(err);
      }
      if (!schema.fields.get('registered')) {
        return done(new Error('Did not pick up `registered` field'));
      }
      done();
    });
  });
  it('should have a probability of 50% for `registered` to be a boolean', function() {
    assert.equal(schema.fields.get('registered').types.get('Boolean').probability, 1 / 2);
  });
  it('should have a probability of 50% for `registered` to be undefined', function() {
    assert.equal(schema.fields.get('registered').types.get('Undefined').probability, 1 / 2);
  });
});
