var Schema = require('./schema');
var es = require('event-stream');

/**
 * Convenience shortcut for parsing schemas.
 * @param {String} ns The namespace of the collection being parsed.
 * @param {Cursor|Array} docs An array of documents or a Cursor returned by `.find()`
 * @param {Function} fn Callback which will be passed `(err, schema)`
 * @return {Schema}
 */
module.exports = function(ns, docs, fn, fast) {
  var schema = new Schema({
    ns: ns
  });
  var src;

  // MongoDB Cursors
  if (docs.stream && typeof docs.stream === 'function') {
    src = docs.stream();
  // Streams
  } else if (docs.pipe && typeof docs.pipe === 'function') {
    src = docs;
  // Arrays
  } else {
    src = es.readArray(docs);
  }

  src.pipe(schema.stream(fast)).pipe(es.wait(function() {
    fn.call(null, null, schema);
  }));
  return schema;
};

module.exports.Schema = Schema;
module.exports.FieldCollection = require('./field-collection');
module.exports.TypeCollection = require('./type-collection');
module.exports.ValueCollection = require('./value-collection');
