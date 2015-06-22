var _ = require('lodash');
var getTypeId = require('./type').getNameFromValue;
var Field = require('./field');

function onFieldSampled(schema, _id, value) {
  var type_id = getTypeId(value);
  if (type_id === 'Array') {
    onEmbeddedArray(schema, _id, type_id, value);
  } else if (type_id === 'Object') {
    onEmbeddedDocument(schema, _id, type_id, value);
  } else {
    onBasicField(schema, _id, type_id, value);
  }
}

function onBasicField(schema, _id, type_id, value) {
  var field = schema.fields.get(_id);
  if (!field) {
    field = schema.fields.add({
      _id: _id,
      klass: Field.Basic,
      parent: schema
    });
  }
  field.count += 1;

  var type = field.types.get(type_id);
  if (!type) {
    type = field.types.add({
      _id: type_id,
    });
  }
  type.count += 1;

  type.values.add({
    _id: value
  });
}

function onEmbeddedArray(schema, _id, type_id, value) {
  var field = schema.fields.get(_id);

  if (!field) {
    field = schema.fields.add({
      _id: _id,
      klass: Field.EmbeddedArray,
      parent: schema
    });
  }

  field.count += 1;
  field.lengths.push(value.length);
  field.trigger('change:lengths');
  _.each(value, function(d) {
    var type_id = getTypeId(d);
    if (type_id === 'Object') {
      _.each(d, function(val, key) {
        onBasicField(field, key, getTypeId(val), val);
      });
    } else {
      onBasicField(field, '__basic__', type_id, d);
    }
  });
}

function onEmbeddedDocument(schema, _id, type_id, value) {
  var field = schema.fields.get(_id);

  if (!field) {
    field = schema.fields.add({
      _id: _id,
      klass: Field.EmbeddedDocument,
      parent: schema
    });
  }
  field.count += 1;
  _.each(value, function(val, key) {
    onFieldSampled(field, key, val);
  });
}

module.exports.parse = onFieldSampled;
