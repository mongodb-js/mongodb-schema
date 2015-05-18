var Schema = require('./schema');
var _ = require('lodash');

module.exports = function(ns, docs) {
  if (!Array.isArray(docs)) {
    docs = [docs];
  }
  var schema = new Schema({
    ns: ns
  });
  _.each(docs, function(doc) {
    schema.sample(doc);
  });
  return schema;
};

module.exports.extend = Schema.extend.bind(Schema);
module.exports.Schema = Schema;
module.exports.getType = require('./type').getNameFromValue;
module.exports.FieldCollection = Schema.FieldCollection;
module.exports.BasicField = Schema.BasicField;
module.exports.EmbeddedArrayField = Schema.EmbeddedArrayField;
module.exports.EmbeddedDocumentField = Schema.EmbeddedDocumentField;
