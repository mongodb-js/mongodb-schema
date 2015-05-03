var schema = require('../lib/schema'),
    defs = require('../lib/definitions'),
    assert = require('assert'),
    allTypes = require('../fixtures/all_types'),
    BSON = require('bson'),
    pkg = require('../package.json');

describe('mongodb-schema', function() {
  var root = defs.ESCAPE + defs.ROOT;

  it('should import correctly', function () {
    assert.ok(schema);
  });

  it('should have a root object with the correct version', function () {
    var result = schema();
    assert.ok(result[root] !== undefined);
    assert.equal(result[root][defs.VERSION], pkg.version);
  });

  it('should have 0 count without any documents', function () {
    var result = schema([]);
    assert.equal(result[root][defs.COUNT], 0);
  });

  it('should throw an error if documents is not an array or undefined', function () {
    assert.throws(function () { schema("i'm not an array") }, TypeError);
    assert.doesNotThrow(function () { schema() });
  });

  it('should parse documents of all types without error', function () {
    assert.ok( schema(allTypes) );
  });

  it('should create the correct type objects inside #schema tag', function () {
    var result = schema([ {a: "foo"}, {a: 1, b: {c: BSON.ObjectId() }} ]);
    console.log(JSON.stringify(result, null, 2));
  })
});

