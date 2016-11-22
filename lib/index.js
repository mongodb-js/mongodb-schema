var stream = require('./stream');
var es = require('event-stream');
var _ = require('lodash');

// var debug = require('debug')('mongodb-schema:wrapper');

/**
 * Convenience shortcut for parsing schemas. Accepts an array, stream or
 * MongoDB cursor object to parse documents from.
 *
 * @param {Cursor|
 *          Array|
 *         Stream} docs       An array, a cursor, or a stream
 * @param {Object} options    Options to pass to schema analysis, currently
 *                            only supports `memoryLimit`. Optional.
 * @param {Function} fn       Callback which will be passed `(err, schema)`
 */
module.exports = function(docs, options, fn) {
  // shift parameters if no options provided
  if (fn === undefined) {
    fn = options;
    options = {};
  }
  if (!_.isPlainObject(options)) {
    fn(new Error('Options must be of type `Object`. Received type `' +
      typeof options + '` instead.'));
  }
  var src;
  // MongoDB Cursors
  if (docs.stream && typeof docs.stream === 'function') {
    src = docs.stream();
  // Streams
  } else if (docs.pipe && typeof docs.pipe === 'function') {
    src = docs;
  // Arrays
  } else if (_.isArray(docs)) {
    src = es.readArray(docs);
  } else {
    fn(new Error('Unknown input type for `docs`. Must be an array, '
      + 'stream or MongoDB Cursor.'));
    return;
  }

  var result;
  src.pipe(stream(options))
    .on('data', function(data) {
      result = data;
    })
    .on('error', function(err) {
      fn(err);
    })
    .on('end', function() {
      fn(null, result);
    });
};

module.exports.stream = stream;
