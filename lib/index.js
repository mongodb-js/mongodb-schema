var stream = require('./stream');
var es = require('event-stream');

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
 * @param {Function} callback      Callback which will be passed `(err, schema)`
 * @return {Promise} You can await promise, or use callback if provided.
 */
module.exports = function(docs, options, callback) {
  const promise = new Promise((resolve, reject) => {
    // shift parameters if no options are specified
    if (_.isUndefined(options) || (_.isFunction(options) && _.isUndefined(callback))) {
      callback = options;
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
      reject(new Error(
        'Unknown input type for `docs`. Must be an array, ' +
          'stream or MongoDB Cursor.'
      ));
      return;
    }

    var result;

    src
      .pipe(stream(options))
      .on('data', function(data) {
        result = data;
      })
      .on('error', function(err) {
        reject(err);
      })
      .on('end', function() {
        resolve(result);
      });
  });

  if (callback && typeof callback === 'function') {
    promise.then(callback.bind(null, null), callback);
  }

  return promise;
};

module.exports.stream = stream;
