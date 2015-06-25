var es = require('event-stream');
var Document = require('./type').Document;

/**
 * The top level schema document
 */
var Schema = Document.extend({
  className: 'Schema',
  idAttribute: 'ns',
  props: {
    ns: {
      type: 'string'
    }
  },
  stream: function() {
    var schema = this;
    return es.map(function(doc, done) {
      schema.parse(doc);
      done();
    });
  }
});

module.exports = Schema;
