var TypeCollection = require('../lib/type-collection');
var Field = require('../lib/field');
var _ = require('lodash');
var assert = require('assert');
var debug = require('debug')('mongodb-schema:test:type-collection');
var bson = require('bson');


describe('TypeCollection', function () {
  var types;
  beforeEach(function () {
    types = new TypeCollection();
  });

  it('should create types automatically with .addToType', function() {
    types.addToType("i'm a string");
    assert.ok(types.get('String'));
    assert.equal(types.get('String').count, 1);
  });

  it('should use existing types with .addToType', function() {
    types.addToType(2);
    types.addToType(3);

    assert.ok(types.get('Number'));
    assert.equal(types.get('Number').count, 2);
    assert.deepEqual(types.get('Number').values.serialize(), [2, 3]);
  });

  it('should pass collection\'s parent down to the values', function () {
    var field = new Field({name: 'myfield'});
    field.types.addToType('some string');
    assert.equal(field.types.get('String').parent, field);
  });

  it('should work with any type of primitive value', function() {
    types.addToType(1);
    types.addToType("str");
    types.addToType(true);
    types.addToType(null);
    types.addToType(undefined);
    types.addToType(new Date(2015, 1, 1));
    types.addToType(/^foo*/i);
    types.addToType(new bson.ObjectID());
    types.addToType(new bson.Long());
    types.addToType(new bson.Double());
    types.addToType(new bson.Timestamp());
    types.addToType(new bson.Symbol());
    types.addToType(new bson.Code());
    types.addToType(new bson.MinKey());
    types.addToType(new bson.MaxKey());
    types.addToType(new bson.DBRef());
    types.addToType(new bson.Binary());

    assert.equal(types.length, 17);
    assert.equal(_.unique(types.pluck('name')).length, 17);
  });

  it('should add array values correctly', function () {
    types.addToType([1, 2, 3]);
    assert.ok(types.get('Array'));
    assert.equal(types.get('Array').count, 1);
    assert.equal(types.get('Array').types.get('Number').count, 3);
    assert.deepEqual(types.get('Array').types.get('Number').values.serialize(), [1, 2, 3]);
  });

  it('should count array values correctly', function () {
    types.addToType([1, 2, 3]);
    types.addToType("foo");
    types.addToType([4]);
    types.addToType(5);

    assert.ok(types.get('Array'));
    assert.equal(types.get('Array').count, 2);
    assert.equal(types.get('Array').types.get('Number').count, 4);
    assert.deepEqual(types.get('Array').types.get('Number').values.serialize(), [1, 2, 3, 4]);
    assert.deepEqual(types.get('Number').count, 1);
    assert.deepEqual(types.get('String').count, 1);
  });
});
