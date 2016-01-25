var DocumentType = require('../lib/types').Document;
var FieldCollection = require('../lib/field-collection');
var assert = require('assert');
var debug = require('debug')('mongodb-schema:test:field-collection');

describe('FieldCollection', function() {
  var collection;

  before(function() {
    collection = new FieldCollection();
  });

  it('should create new field if the field name is not present', function() {
    collection.addToField('foo', 1);
    assert.ok(collection.get('foo'));
    assert.equal(collection.length, 1);
  });

  it('should pass down collection\'s parent to its values', function() {
    var doc = new DocumentType();
    doc.analyze({
      foo: 1,
      bar: 1
    });
    assert.equal(doc.fields.get('foo').parent, doc);
  });

  it('should trigger change:probability events in affected children', function(done) {
    collection.addToField('friend_count', 16);
    collection.addToField('friend_count', 5);
    collection.addToField('friend_count', '16');
    collection.addToField('friend_count', '5');

    var friendCountField = collection.get('friend_count');
    assert.deepEqual(friendCountField.types.pluck('probability'), [0.5, 0.5]);

    // Because `Number` was added to `friendCountField.types` first,
    // it's the first `Type` instance to respond to any changes to
    // `probability` in it's siblings.
    friendCountField.types.get('Number').on('change:probability', function(model, newVal) {
      debug('Number changed probability to', newVal);
      assert.equal(newVal, 0.4);
    });

    // `String` will respond last and because we're adding a string,
    // we'll go from 50% String -> 60% String.
    friendCountField.types.get('String').on('change:probability', function(model, newVal) {
      debug('String changed probability to', newVal);
      assert.equal(newVal, 0.6);
      done();
    });

    collection.addToField('friend_count', '10');
    assert.deepEqual(friendCountField.types.pluck('probability'), [0.4, 0.6]);
  });
});
