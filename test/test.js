var schema = require('../');
var assert = require('assert');

describe('mongodb-schema', function() {
  it('should work', function() {
    assert.ok(schema);
    assert.ok(schema.Schema);
  });
});

