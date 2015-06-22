var Schema = require('./schema');
var es = require('event-stream');

/**
 * Convenience shortcut for parsing schemas.
 * @param {String} ns The namespace of the collection being parsed.
 * @param {Cursor|Array} docs An array of documents or a Cursor returned by `.find()`
 * @param {Function} fn Callback which will be passed `(err, schema)`
 * @returns {Schema}
 */
module.exports = function(ns, docs, fn) {
  var schema = new Schema({
    ns: ns
  });
  var src;

  if(docs.stream){
    src = docs.stream();
  }
  else{
    src = es.readArray(docs);
  }

  src.pipe(schema.stream()).on('end', function(){
    fn.call(null, null, schema);
  });
  return schema;
};

module.exports.Schema = Schema;
