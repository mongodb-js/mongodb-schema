var AmpersandState = require('ampersand-state');
var AmpersandCollection = require('ampersand-collection');
var es = require('event-stream');
var _ = require('lodash');
var debug = require('debug')('mongodb-schema');

var Type = require('./type');
var TypeCollection = require('./type-collection');
var ValueCollection = require('./value-collection');

var FieldCollection = AmpersandCollection.extend({
  mainIndex: '_id',
  comparator: '_id'
});

var Field = AmpersandState.extend({
  idAttribute: '_id',
  props: {
    _id: {
      type: 'string',
      required: true
    },
    displayName: {
      type: 'string',
      default: function() {
        return this._id;
      }
    },
    description: {
      type: 'string'
    },
    count: {
      type: 'number',
      default: 0
    },
    has_children: {
      type: 'boolean',
      default: false
    },
  },
  collections: {
    types: TypeCollection,
    values: ValueCollection,
    fields: FieldCollection
  },
  initialize: function() {
    var field = this;
    this.types.on('add', function(type) {
      type.values.on('add', function(model) {
        field.count += 1;
        type.count += 1;
        this.parent.values.add(model);
      }.bind(this));
    });

    this.fields.on('add', function() {
      this.has_children = true;
    }.bind(this));
  }
});

FieldCollection.prototype.model = Field;

function add_value(schema, _id, type_id, value) {
  var field = schema.fields.get(_id);
  var type;

  if (!field) {
    debug('`%s` is a new field with type %s', _id);
    field = schema.fields.add({
      _id: _id
    });
  }

  type = field.types.get(type_id);
  if (!type) {
    type = field.types.add({
      _id: type_id
    });
  }

  type.values.add({
    _id: value
  });
}

function deflate(schema, _id, value) {
  var type_id = Type.getNameFromValue(value);
  var field;

  if (type_id === 'Array') {
    field = schema.fields.get(_id);

    if (!field) {
      debug('`%s` is a new field with type %s', _id);
      field = schema.fields.add({
        _id: _id
      });
    }
    return;
  }
  if (type_id === 'Object') {
    field = schema.fields.get(_id);

    if (!field) {
      debug('`%s` is a new field with type %s', _id);
      field = schema.fields.add({
        _id: _id
      });
    }
    _.each(_.pairs(value), function(d) {
      deflate(field, d[0], d[1]);
    });
    return;
  }
  add_value(schema, _id, type_id, value);
}

var Schema = AmpersandState.extend({
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
      _.each(_.pairs(doc), function(d) {
        deflate(schema, d[0], d[1]);
        this.emit('data', doc);
      }, this);
    }, function() {
        debug('finalized schema is', JSON.stringify(schema, null, 2));
        this.emit('end');
      });
  }
});

module.exports = Schema;
