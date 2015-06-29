var es = require('event-stream');
var Document = require('./types').Document;

/**
 * The top level schema document, like a Document type
 * but with extra stream interface.
 */
var Schema = Document.extend({
  idAttribute: 'ns',
  props: {
    ns: {
      type: 'string'
    },
    name: {
      default: 'Schema'
    }
  },
  stream: function() {
    var schema = this;
    var stream = es.map(function(doc, done) {
      schema.parse(doc);
      done();
    });
    stream.on('end', function () {
      schema.trigger('end', this);
    });
    return stream;
  }
});

module.exports = Schema;
