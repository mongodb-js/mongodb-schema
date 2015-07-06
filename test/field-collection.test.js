var DocumentType = require('../lib/types').Document;
var FieldCollection = require('../lib/field-collection');
var assert = require('assert');

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
    var doc = new DocumentType();
    doc.parse({foo: 1, bar: 1});
    assert.equal(doc.fields.get('foo').parent, doc);
  });

  it('should trigger change:probability events in unaffected children', function (done) {
    collection.addToField('field', 16);
    collection.addToField('field', 5);
    collection.addToField('field', 'foo');
    collection.addToField('field', 'bar');
    var field = collection.get('field');
    assert.deepEqual(field.types.pluck('probability'), [0.5, 0.5]);

    field.types.get('Number').on('change:probability', function () {
      assert.deepEqual(field.types.pluck('probability'), [0.4, 0.6]);
      done();
    });
    collection.addToField('field', 'baz');
  });

});
