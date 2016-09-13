var getSchema = require('../');
var assert = require('assert');
var _ = require('lodash');

// var debug = require('debug')('mongodb-schema:test:wrapper');

describe('Convenience Wrapper', function() {
  it('should be available as a function', function() {
    assert.ok(getSchema);
    assert.equal(typeof getSchema, 'function');
  });

  it('should accept documents as an array and return a schema', function(done) {
    getSchema([{
      a: 1
    }, {
      a: 2,
      b: false
    }], function(err, res) {
      assert.ifError(err);
      assert.ok(res);
      assert.equal(typeof res, 'object');
      assert.ok(_.has(res, 'count'));
      assert.ok(_.has(res, 'fields'));
      assert.equal(res.count, 2);
      done();
    });
  });

  it('should return an error when no documents are provided', function() {
    getSchema('', function(err) {
      assert.ok(err);
    });
  });
});
