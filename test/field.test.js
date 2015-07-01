var Field = require('../lib/field');
var assert = require('assert');
var debug = require('debug')('mongodb-schema:test:type');

describe('Field', function () {
  var field;
  beforeEach(function () {
    field = new Field();
  });

  it('should be constructable', function () {
    assert.ok(field);
  });

  it('should return single type string for Field#type for one type', function () {
    field.types.addToType(16);
    field.types.addToType(5);
    field.types.addToType(-1);
    assert.equal(field.type, 'Number');
  });

  it('should return array of type strings for Field#type for multiple types', function () {
    field.types.addToType(16);
    field.types.addToType(5);
    field.types.addToType("foo");
    field.types.addToType("bar");
    assert.deepEqual(field.type, ['Number', 'String']);
  });

  it('should return undefined for Field#type if no types present', function () {
    assert.equal(field.type, undefined);
  });

  it('should trigger change:types.length events when adding a new type', function (done) {
    field.on('change:types.length', function () {
      assert.equal(field.types.length, 1);
      done();
    });
    field.types.addToType(15);
  });

  it('should update Field#type when adding more values', function () {
    field.types.addToType(15);
    assert.equal(field.type, 'Number');
    field.types.addToType("sfo");
    assert.deepEqual(field.type, ['Number', 'String']);
  });

  it('should update .fields alias correctly', function () {
    assert.equal(field.fields, null);
    field.types.addToType({foo: 1});
    assert.equal(field.fields, field.types.get('Document').fields);
  });

  it('should update .arrayFields alias correctly', function () {
    assert.equal(field.arrayFields, null);
    field.types.addToType([{foo: 1}]);
    assert.equal(field.arrayFields, field.types.get('Array').fields);
    assert.ok(field.arrayFields.get('foo'));
  });

});
