var es = require('event-stream');
var _ = require('lodash');
var DocumentType = require('./types').Document;

/**
 * The top level schema document, like a Document type
 * but with extra stream interface.
 */
var Schema = DocumentType.extend({
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
    var model = this;
    return es.map(function(doc, done) {
      model.parse(doc);
      done(null, doc);
    });
  },
  serialize: function() {
    var res = this.getAttributes({
      props: true,
      derived: true
    }, true);
    res = _.omit(res, ['total_count', 'modelType', 'name']);
    res.fields = this.fields.serialize();
    return res;
  }
});

module.exports = Schema;
