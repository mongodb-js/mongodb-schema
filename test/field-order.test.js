var getSchema = require('../');
var assert = require('assert');

describe('order of fields', function() {
  it('should have _id fields always at top, even with uppercase fields', function(done) {
    var docs = [{
      FOO: 1,
      _id: 1,
      BAR: 1,
      zoo: 1
    }];
    getSchema('field.order', docs, function(err, schema) {
      assert.ifError(err);
      assert.deepEqual(schema.fields.map(function(field) {
        return field.getId();
      }), ['_id', 'BAR', 'FOO', 'zoo']);
      done();
    });
  });
  it('should sort keys in case-insensitive manner', function(done) {
    var docs = [{
      cb: 1,
      Ca: 1,
      cC: 1,
      a: 1,
      b: 1
    }];
    getSchema('field.order', docs, function(err, schema) {
      assert.ifError(err);
      assert.deepEqual(schema.fields.map(function(field) {
        return field.getId();
      }), ['a', 'b', 'Ca', 'cb', 'cC']);
      done();
    });
  });
});
