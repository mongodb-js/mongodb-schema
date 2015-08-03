var es = require('event-stream');
var _ = require('lodash');
var DocumentType = require('./types').Document;
var State = require('ampersand-state');
var FieldCollection = require('./field-collection');

/**
 * The top level schema document, like a Document type
 * but with extra stream interface.
 */
var Schema = State.extend({
  idAttribute: 'ns',
  props: {
    ns: {
      type: 'string'
    },
    name: {
      default: 'Schema'
    },
    count: {
      type: 'number',
      default: 0
    }
  },
  collections: {
    fields: FieldCollection
  },
  parse: function(obj) {
    return DocumentType.prototype.parse.call(this, obj);
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
    res = _.omit(res, ['name']);
    res.fields = this.fields.serialize();
    return res;
  }
});

module.exports = Schema;
