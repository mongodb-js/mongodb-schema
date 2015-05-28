var Schema = require('./schema');
var es = require('event-stream');
var assert = require('assert');

module.exports = function(ns, docs, fn) {
  assert(Array.isArray(docs), 'docs must be an array');
  var schema = new Schema({
    ns: ns
  });

  es.readArray(docs).pipe(schema.stream()).on('end', fn);
  return schema;
};

module.exports.extend = Schema.extend.bind(Schema);
module.exports.Schema = Schema;
module.exports.getType = require('./type').getNameFromValue;
module.exports.FieldCollection = Schema.FieldCollection;
module.exports.BasicField = Schema.BasicField;
module.exports.EmbeddedArrayField = Schema.EmbeddedArrayField;
module.exports.EmbeddedDocumentField = Schema.EmbeddedDocumentField;
module.exports.TypeCollection = require('./type-collection');
