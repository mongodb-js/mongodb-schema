var AmpersandState = require('ampersand-state');
var debug = require('debug')('mongodb-schema');
var es = require('event-stream');
var flatten = require('./flatten');
var _ = require('lodash');

var FieldCollection = require('./field-collection');
var Type = require('./type');

module.exports = AmpersandState.extend({
  collections: {
    fields: FieldCollection
  },
  initialize: function(options) {
    options = options || {};
    this.ns = options.ns;
  },
  stream: function() {
    var schema = this;
    return es.through(function(doc) {
      debug('updating based on %j', doc);
      _.each(_.pairs(flatten(doc)), function(d) {
        var _id = d[0];
        var value = d[1];
        var T = Type.getNameFromValue(d[1]);
        var field = schema.fields.get(_id);
        var existingType;

        if (value === 'Array') {
          return debug('@todo: smush nested arrays.  skipping `%s`', _id);
        }
        if (value === 'Object') {
          return debug('@todo: smush nested objects.  skipping `%s`', _id);
        }

        debug(_id, T, value, '' + value);
        value = '' + value;
        if (!field) {
          debug('`%s` is a new field with type %s', _id, T);
          field = schema.fields.add({
            _id: _id
          });

          field.types.add({
            _id: T
          }).values.add(value);
        } else {
          existingType = field.types.get(T);
          if (!existingType) {
            field.types.add({
              _id: T
            }).values.add(value);
          } else {
            existingType.values.add(value);
          }
        }
        this.emit('data', field);
      }, this);
    }, function() {
        debug('finalized schema is', JSON.stringify(schema, null, 2));
        this.emit('end');
      });
  }
});
