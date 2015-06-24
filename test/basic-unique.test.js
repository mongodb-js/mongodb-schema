var getSchema = require('../');
var assert = require('assert');

describe('unique', function() {
  var docs = [
    {
      _id: 1,
      registered: true
    },
    {
      _id: 2,
      registered: true
    }
  ];

  var schema;
  before(function(done) {
    schema = getSchema('unique', docs, function(err) {
      if (err) return done(err);
      if (!schema.fields.get('_id')) {
        return done(new Error('Did not pick up `_id` field'));
      }
      done();
    });
  });

  it('should have count of 2 for `_id`', function() {
    assert.equal(schema.fields.get('_id').count, 2);
  });

  it('should have unique of 2 for `_id`', function() {
    assert.equal(schema.fields.get('_id').unique, 2);
    assert.equal(schema.fields.get('_id').types.get('Number').unique, 2);
  });

  it('should not have duplicates for `_id`', function() {
    assert.equal(schema.fields.get('_id').has_duplicates, false);
  });

  it('should have count of 2 for `registered`', function() {
    assert.equal(schema.fields.get('registered').count, 2);
  });

  it('should have unique of 1 for `registered`', function() {
    assert.equal(schema.fields.get('registered').unique, 1);
  });

  it('should have duplicates for `registered`', function() {
    assert.equal(schema.fields.get('registered').has_duplicates, true);
  });
});
