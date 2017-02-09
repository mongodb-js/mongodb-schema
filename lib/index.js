var stream = require('./stream');
var es = require('event-stream');
var _ = require('lodash');

// var debug = require('debug')('mongodb-schema:wrapper');

/**
 * Convenience shortcut for parsing schemas. Accepts an array, stream or
 * MongoDB cursor object to parse documents from.
 *
 * @param {Cursor|Array|Stream}  docs      An array, a cursor, or a stream
 *
 * @param {Object}   options                options (optional)
 * @param {Boolean}  options.semanticTypes  enable semantic type detection (default: false)
 * @param {Boolean}  options.storeValues    enable storing of values (default: true)
 *
 * @param {Function} fn      Callback which will be passed `(err, schema)`
 */
module.exports = function(docs, options, fn) {
  // shift parameters if no options are specified
  if (_.isUndefined(options) || _.isFunction(options) && _.isUndefined(fn)) {
    fn = options;
    options = {};
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
