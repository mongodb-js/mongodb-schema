var Schema = require('../lib/schema');
var assert = require('assert');
var debug = require('debug')('mongodb-schema:test:schema');


describe('Schema', function () {
  var schema;
  beforeEach(function () {
    schema = new Schema();
  });

  it('should be constructable', function() {
    assert.ok(schema);
  });

  it('should parse a simple document', function () {
    schema.parse({foo: 1});
    assert.ok(schema.fields.get('foo'));
    assert.equal(schema.count, 1);
  });

  it('should parse a nested document', function () {
    schema.parse({foo: {bar: 1}});
    assert.ok(schema.fields.get('foo'));
    assert.ok(schema.fields.get('foo').types.get('Document').fields.get('bar'));
    assert.equal(schema.count, 1);
    assert.equal(schema.fields.get('foo').types.get('Document').count, 1);
  });

  it('should set up the parent tree all the way down', function () {
    schema.parse({foo: {bar: [1, 2, 3]}});
    var foo = schema.fields.get('foo');
    assert.equal(foo.parent, schema);
    var subdoc = foo.types.get('Document');
    assert.equal(subdoc.parent, foo);
    var bar = subdoc.fields.get('bar');
    assert.equal(bar.parent, subdoc);
    var arr = bar.types.get('Array');
    assert.equal(arr.parent, bar);
    var num = arr.types.get('Number');
    assert.equal(num.parent, arr);
    var val = num.values.at(0);
    assert.equal(val.parent, num);
  });
});
