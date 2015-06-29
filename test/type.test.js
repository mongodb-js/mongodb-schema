var type = require('../lib/type');
var assert = require('assert');
var debug = require('debug')('mongodb-schema:test:type');

describe('Array', function () {
  var arr;
  beforeEach(function () {
    arr = new type.Array();
  });
  it('should be constructable', function () {
    assert.ok(arr);
  });

  it('should return Array as its namespace', function () {
    assert.equal(arr.getNamespace(), 'Array');
  });

  it('should add values of a single type to the correct type', function () {
    arr.parse([5, 2, 5, 5, 0]);
    assert.deepEqual(arr.types.get('Number').values.serialize(), [5, 2, 5, 5, 0]);
  });

  it('should throw if the value is not an array', function () {
    assert.throws(function() {
      arr.parse(5);
    });
  });

  it('should return null for Type#fields if it does not have a Document type', function() {
    arr.parse([1, 2, 3, "string",  false]);
    assert.equal(arr.fields, null);
  });

  it('should add values of a mixed types to the correct types', function () {
    arr.parse([false, "foo", true, "bar"]);
    assert.deepEqual(arr.types.get('Boolean').values.serialize(), [false, true]);
    assert.deepEqual(arr.types.get('String').values.serialize(), ["foo", "bar"]);
  });
});


describe('Document', function () {
  var doc;
  beforeEach(function () {
    doc = new type.Document();
  });
  it('should be constructable', function () {
    assert.ok(doc);
  });

  it('should throw if the value is not an object', function () {
    assert.throws(function () {
      doc.parse([1, 2, 3]);
    });
  });

  it('should return null for Type#fields if it does not have a Document type', function() {
    doc.parse({foo: 1});
    doc.parse({foo: 2});
    doc.parse({foo: 3});
    assert.equal(doc.fields.get('foo').fields, null);
  });

  it('should add fields recursively', function () {
    doc.parse({foo: 1});
    doc.parse({foo: 2});
    doc.parse({foo: 3});
    doc.parse({foo: 'hello', bar: 'good bye'});
    assert.ok(doc.fields.get('foo'));
    assert.deepEqual(doc.fields.get('foo').types.get('Number').values.serialize(), [1, 2, 3]);
    assert.deepEqual(doc.fields.get('foo').types.get('String').values.serialize(), ['hello']);
    assert.deepEqual(doc.fields.get('bar').types.get('String').values.serialize(), ['good bye']);
  });
});
