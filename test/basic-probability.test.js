var getSchema = require('../');
var assert = require('assert');
var _ = require('lodash');

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
      if (!_.find(res.fields, 'name', 'registered')) {
        return done(new Error('Did not pick up `registered` field'));
      }
      schema = res;
      done();
    });
  });
  it('should have a probability of 50% for `registered` to be a boolean', function() {
    assert.equal(_.find(_.find(schema.fields, 'name', 'registered').types,
      'name', 'Boolean').probability, 1 / 2);
  });
  it('should have a probability of 50% for `registered` to be undefined', function() {
    assert.equal(_.find(_.find(schema.fields, 'name', 'registered').types,
      'name', 'Undefined').probability, 1 / 2);
  });
});
