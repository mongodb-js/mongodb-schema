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

  it('should add values of a single type to the correct type', function () {
    arr.addValue([5, 2, 5, 5, 0]);
    assert.deepEqual(arr.types.get('Number').values.serialize(), [5, 2, 5, 5, 0]);
  });

  it('should throw if the value is not an array', function () {
    assert.throws(function() {
      arr.addValue(5);
    });
  });

  it('should add values of a mixed types to the correct types', function () {
    arr.addValue([false, "foo", true, "bar"]);
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
      doc.addValue([1, 2, 3]);
    });
  });

  it('should add fields recursively', function () {
    doc.addValue({foo: 1});
    doc.addValue({foo: 2});
    doc.addValue({foo: 3});
    doc.addValue({foo: 'hello', bar: 'good bye'});
    assert.ok(doc.fields.get('foo'));
    assert.deepEqual(doc.fields.get('foo').values.serialize(), [1, 2, 3, 'hello']);
    assert.deepEqual(doc.fields.get('foo').types.get('Number').values.serialize(), [1, 2, 3]);
    assert.deepEqual(doc.fields.get('foo').types.get('String').values.serialize(), ['hello']);
    assert.deepEqual(doc.fields.get('bar').types.get('String').values.serialize(), ['good bye']);
  });
});

