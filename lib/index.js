var AmpersandState = require('ampersand-state');
var FieldCollection = require('./models/field-collection');
var debug = require('debug')('mongodb-schema:models:schema');
var es = require('event-stream');
var flatten = require('./flatten');
var _ = require('lodash');

function getValueType(value) {
  var T;
  if (_.has(value, '_bsontype')) {
    T = value._bsontype;
  } else {
    T = Object.prototype.toString.call(value).replace(/\[object (\w+)\]/, '$1');
  }
  return T;
}

function isArrayKey(_id) {
  return /\[(\d+)\]/.test(_id);
}

var Schema = AmpersandState.extend({
  collections: {
    fields: FieldCollection
  },
  props: {
    count: {
      type: 'number',
      default: 0
    }
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
        var T = getValueType(d[1]);
        var field = schema.fields.get(_id);
        var existingType;
        if (value === 'Array') {
          return debug('@todo: smush nested arrays.  skipping `%s`', _id);
        }
        if (value === 'Object') {
          return debug('@todo: smush nested objects.  skipping `%s`', _id);
        }
        schema.count += 1;

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
          // debug('`%s` is already a known field with types', _id, field.types.map(function(d) {
          //   return d.getId();
          // }));

          existingType = field.types.get(T);
          if (!existingType) {
            // debug('new type `%s` for field `%s`', T, _id);
            field.types.add({
              _id: T
            }).values.add(value);
          } else {
            // debug('updating existing type %j', existingType);
            existingType.values.add(value);
          }
        }
        this.emit('data', field);
      }, this);
    }, function() {
        // debug('finalized schema is', JSON.stringify(schema, null, 2));
        console.table(schema.fields.serialize());
        this.emit('end');
      });
  }
});

module.exports = function() {
  return new Schema();
};

module.exports.extend = Schema.extend;

module.exports.stream = function() {
  return new Schema().stream();
};
module.exports.Schema = Schema;
module.exports.FieldCollection = require('./models/field-collection');
