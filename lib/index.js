var inherits = require('util').inherits;
var debug = require('debug')('mongodb-schema');
var stream = require('stream');


function SchemaTransformStream(opts) {
  opts = opts || {};
  SchemaTransformStream._super.call(this, {
    objectMode: true
  });
}

inherits(SchemaTransformStream, stream.Transform);

SchemaTransformStream.prototype._transform = function(document, encoding, done) {
  debug('_transform: %j', {
    encoding: encoding,
    document: document
  });
  done();
};

module.exports.stream = SchemaTransformStream;
