var AmpersandState = require('ampersand-state');
var FieldCollection = require('./models/field-collection');
var debug = require('debug')('mongodb-schema:models:schema');
var es = require('event-stream');
var flatten = require('flatnest').flatten;
var _ = require('lodash');

function getValueType(value) {
  var T;
  if (_.has(value, '_bsonType')) {
    T = value._bsonType;
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
  stream: function() {
    var schema = this;
    return es.through(function(doc) {
      debug('updating based on %j', doc);
      _.each(_.pairs(flatten(doc)), function(d) {
        var _id = d[0];
        var value = d[1];
        var T = getValueType(d[1]);
        var field = schema.fields.get(_id);

        if (isArrayKey(_id)) {
          return debug('@todo: smush nested arrays.  skipping `%s`', _id);
        }

        if (!field) {
          debug('`%s` is a new field', _id);
          field = schema.fields.add({
            _id: _id,
            count: 1
          });

          field.types.add({
            _id: T,
            count: 1,
            value: value
          });
        } else {
          debug('`%s` is already a known field with %d type(s)', _id, field.types.length);
          var existingType = field.types.get(T);
          if (!existingType) {
            debug('new type `%s` for field `%s`', T, _id);
            field.types.add({
              _id: T,
              count: 1,
              value: value
            });
          } else {
            debug('updating existing type %j', existingType);
            existingType.values.push(value);
            existingType.count += 1;
          }
          field.count += 1;
        }
        this.emit('data', field);
      }, this);
      schema.count += 1;
    }, function() {
      debug('finalized schema is', JSON.stringify(schema, null, 2));
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
