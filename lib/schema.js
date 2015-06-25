var es = require('event-stream');
var _ = require('lodash');
var State = require('ampersand-state');
var FieldCollection = require('./field-collection');

/**
 * The top level schema state.
 * @class
 */
var Schema = State.extend({
  className: 'Schema',
  idAttribute: 'ns',
  props: {
    ns: {
      type: 'string'
    },
    count: {
      type: 'number',
      default: 0
    }
  },
  collections: {
    fields: FieldCollection
  },
  parse: function(doc, done) {
    var schema = this;
    schema.count += 1;
    _.each(doc, function(val, key) {
      schema.fields.addToField(key, val);
    });
    // schema.fields.map(function(field) {
    //   field.commit();
    // });
    if (_.isFunction(done)) {
      done();
    }
  },
  stream: function() {
    var schema = this;
    return es.map(function(doc, done) {
      schema.parse(doc, function(err) {
        done(err, doc);
      });
    });
  }
});

module.exports = Schema;
