var _ = require('lodash');
var getTypeName = require('./type').getNameFromValue;
var Field = require('./field');

function onFieldSampled(schema, name, value) {
  var typeName = getTypeName(value);
  if (typeName === 'Array') {
    onEmbeddedArray(schema, name, typeName, value);
  } else if (typeName === 'Object') {
    onEmbeddedDocument(schema, name, typeName, value);
  } else {
    onBasicField(schema, name, typeName, value);
  }
}

function onBasicField(schema, name, typeName, value) {
  var field = schema.fields.get(name);
  if (!field) {
    field = schema.fields.add({
      name: name,
      klass: Field.Basic,
      parent: schema
    });
  }
  field.count += 1;

  var type = field.types.get(typeName);
  if (!type) {
    type = field.types.add({
      name: typeName,
    });
  }
  type.count += 1;

  type.values.add({
    value: value
  });
}

function onEmbeddedArray(schema, name, typeName, value) {
  var field = schema.fields.get(name);

  if (!field) {
    field = schema.fields.add({
      name: name,
      klass: Field.EmbeddedArray,
      parent: schema
    });
  }

  field.count += 1;
  field.lengths.push(value.length);
  field.trigger('change:lengths');
  _.each(value, function(d) {
    var typeName = getTypeName(d);
    if (typeName === 'Object') {
      _.each(d, function(val, key) {
        onBasicField(field, key, getTypeName(val), val);
      });
    } else {
      onBasicField(field, '__basic__', typeName, d);
    }
  });
}

function onEmbeddedDocument(schema, name, typeName, value) {
  var field = schema.fields.get(name);

  if (!field) {
    field = schema.fields.add({
      name: name,
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
