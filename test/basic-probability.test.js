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
    getSchema(docs, function(err, res) {
      assert.ifError(err);
      if (!res.fields.find(v => v.name === 'registered')) {
        return done(new Error('Did not pick up `registered` field'));
      }
      schema = res;
      done();
    });
  });
  it('should have a probability of 50% for `registered` to be a boolean', function() {
    var types = schema.fields.find(v => v.name === 'registered').types;
    assert.equal(types.find(v => v.name === 'Boolean').probability, 1 / 2);
  });
  it('should have a probability of 50% for `registered` to be undefined', function() {
    var types = schema.fields.find(v => v.name === 'registered').types;
    assert.equal(types.find(v => v.name === 'Undefined').probability, 1 / 2);
  });
});
