var Schema = require('./schema');
var es = require('event-stream');

module.exports = function(ns, docs, fn) {
  if (!Array.isArray(docs)) {
    docs = [docs];
  }
  var schema = new Schema({
    ns: ns
  });

  var stream = es.readArray(docs).pipe(schema.stream());
  if (fn) {
    stream.on('end', fn);
  }

  return schema;
};

module.exports.extend = Schema.extend.bind(Schema);
module.exports.Schema = Schema;
module.exports.getType = require('./type').getNameFromValue;
module.exports.FieldCollection = Schema.FieldCollection;
module.exports.BasicField = Schema.BasicField;
module.exports.EmbeddedArrayField = Schema.EmbeddedArrayField;
module.exports.EmbeddedDocumentField = Schema.EmbeddedDocumentField;
