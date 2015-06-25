var Document = require('../lib/type').Document;
var FieldCollection = require('../lib/field-collection');
var _ = require('lodash');
var assert = require('assert');
var debug = require('debug')('mongodb-schema:test:field-collection');

describe('FieldCollection', function () {
  var collection;

  before(function () {
    collection = new FieldCollection();
  });

  it('should create new field if the field name is not present', function () {
    collection.addToField('foo', 1);
    assert.ok(collection.get('foo'));
    assert.equal(collection.length, 1);
  });

  it('should pass down collection\'s parent to its values', function () {
    var doc = new Document();
    doc.addValue({foo: 1, bar: 1});
    assert.equal(doc.fields.get('foo').parent, doc);
  });
});
