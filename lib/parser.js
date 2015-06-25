// var _ = require('lodash');

// var getTypeName = module.exports.getTypeName = function (value) {
//   var T;
//   if (_.has(value, '_bsontype')) {
//     T = value._bsontype;
//   } else {
//     T = Object.prototype.toString.call(value).replace(/\[object (\w+)\]/, '$1');
//   }
//   // don't want to create naming conflict with javascript Object
//   if (T === 'Object') T = 'Document';
//   return T;
// };

// var addValueToType = module.exports.addValueToTypes = function (types, value) {
//   var typeName = getTypeName(value);
//   // get or create type
//   var type = types.get(typeName);
//   if (!type) {
//     type = types.add({
//       name: typeName
//     });
//   }
//   type.count += 1;
//   // leave it to type to add the value
//   type.addValue(value);
// };

// module.exports.addValueToFields = function(schema, name, value) {
//   // get or create field
//   var field = schema.fields.get(name);
//   if (!field) {
//     field = schema.fields.add({
//       name: name,
//       parent: schema
//     });
//   }
//   field.count += 1;

//   addValueToType(field.types, value);
// };


// function onEmbeddedArray(schema, name, typeName, value) {
//   var field = schema.fields.get(name);

//   if (!field) {
//     field = schema.fields.add({
//       name: name,
//       klass: Field.EmbeddedArray,
//       parent: schema
//     });
//   }

//   field.count += 1;
//   field.lengths.push(value.length);
//   field.trigger('change:lengths');
//   _.each(value, function(d) {
//     var typeName = getTypeName(d);
//     if (typeName === 'Object') {
//       _.each(d, function(val, key) {
//         onBasicField(field, key, getTypeName(val), val);
//       });
//     } else {
//       onBasicField(field, '__basic__', typeName, d);
//     }
//   });
// }

// function onEmbeddedDocument(schema, name, typeName, value) {
//   var field = schema.fields.get(name);

//   if (!field) {
//     field = schema.fields.add({
//       name: name,
//       klass: Field.EmbeddedDocument,
//       parent: schema
//     });
//   }
//   field.count += 1;
//   _.each(value, function(val, key) {
//     onFieldSampled(field, key, val);
//   });
// }
