var ArrayType = require('../lib/types').Array;
var assert = require('assert');

describe('Array', function() {
  var arr;
  beforeEach(function() {
    arr = new ArrayType();
  });

  it('should be constructable', function() {
    assert.ok(arr);
  });

  it('should trigger types.length events when adding a new type', function(done) {
    arr.on('change:types.length', function() {
      assert.equal(arr.types.length, 1);
      done();
    });
    arr.types.addToType(15);
  });

  it('should update .fields alias correctly', function() {
    assert.equal(arr.fields, null);
    arr.types.addToType({
      foo: 1
    });
    assert.equal(arr.fields, arr.types.get('Document').fields);
  });
});
