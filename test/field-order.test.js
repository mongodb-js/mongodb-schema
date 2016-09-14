var getSchema = require('../');
var assert = require('assert');
var _ = require('lodash');

var debug = require('debug')('mongodb-schema:test:field-order');

describe('order of fields', function() {
  it('should have _id fields always at top, even with uppercase fields', function(done) {
    var docs = [{
      FOO: 1,
      _id: 1,
      BAR: 1,
      zoo: 1
    }];
    getSchema(docs, function(err, schema) {
      assert.ifError(err);
      assert.deepEqual(_.pluck(schema.fields, 'name'), ['_id', 'BAR', 'FOO', 'zoo']);
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
    getSchema(docs, function(err, schema) {
      assert.ifError(err);
      debug('schema.fields', schema.fields);
      assert.deepEqual(_.pluck(schema.fields, 'name'), ['a', 'b', 'Ca', 'cb', 'cC']);
      done();
    });
  });
});
