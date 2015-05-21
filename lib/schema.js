var Collection = require('ampersand-collection').extend(require('ampersand-collection-lodash-mixin'));
var State = require('ampersand-state');
var es = require('event-stream');
var _ = require('lodash');
var debug = require('debug')('mongodb-schema');

var Type = require('./type');
var TypeCollection = require('./type-collection');
var ValueCollection = require('./value-collection');

var FieldCollection = Collection.extend({
  mainIndex: '_id',
  comparator: '_id'
});

var Field = State.extend({
  idAttribute: '_id',
  props: {
    /**
     * The key in the `parent`.
     */
    _id: {
      type: 'string',
      required: true
    },
    /**
     * Number of times this field has been seen in a sample of documents.
     */
    count: {
      type: 'number',
      default: 0
    },
    unique: {
      type: 'number',
      default: 0
    },
    /**
     * Title, description and default from JSON Schema:
     * http://spacetelescope.github.io/understanding-json-schema/reference/generic.html#metadata
     */
    /**
     * If using shortened keys to save space, it is expected this be the "real"
     * name of the field that could be input by the user.  For example,
     * if `u` is the field's `_id`, `username` is the field's title
     * and is much friendlier for humans.
     */
    title: {
      type: 'string',
      default: function() {
        return this._id;
      }
    },
    default: 'any',
    description: 'string',
  },
  session: {
    parent: 'state'
  },
  derived: {
    /**
     * The most common type seen for this field.
     *
     * http://spacetelescope.github.io/understanding-json-schema/reference/type.html
     */
    type: {
      deps: ['types'],
      fn: function() {
        if (this.types.length === 0) {
          return undefined;
        }
        if (this.types.length === 1) {
          return this.types.at(0)._id;
        }
        return this.types.pluck('_id');
      }
    },
    probability: {
      deps: ['count', 'parent.count'],
      fn: function() {
        var schema = this.parent;
        return this.count / schema.count;
      }
    },
    has_duplicates: {
      deps: ['unique', 'count'],
      fn: function() {
        return this.unique < this.count;
      }
    }
  },
  collections: {
    types: TypeCollection,
    /**
     * A sample of values seen for this field.
     */
    values: ValueCollection,
    fields: FieldCollection
  },
  initialize: function() {
    var field = this;
    this.types.on('add', function(type) {
      if (!type.values) {
        console.warn('wtf? type has no values?', type);
        return;
      }

      type.on('change:unique', function() {
        field.unique = _.sum(field.types.pluck('unique'));
      });

      type.values.on('add', function(value) {
        field.count += 1;
        type.count += 1;
        field.values.add(value);

        field.types.map(function(type) {
          type.set({
            probability: type.count / field.count,
            unique: _.unique(type.values.pluck('value')).length
          });
        });

        field.types.trigger('sync');
      });
    });
  },
  serialize: function() {
    var res = this.getAttributes({
      props: true,
      derived: true
    }, true);
    if (this.fields.length > 0) {
      res.fields = this.fields.serialize();
    } else {
      res.values = this.values.serialize();
      res.types = this.types.serialize();
    }
    return res;
  },
});

/**
 * A basic field has no descendant fields, such as `String`, `ObjectID`,
 * `Boolean`, or `Date`.
 */
var BasicField = Field.extend({});

var EmbeddedArrayField = Field.extend({
  props: {
    type: {
      type: 'string',
      default: 'Array'
    }
  }
});

var EmbeddedDocumentField = Field.extend({
  props: {
    type: {
      type: 'string',
      default: 'Object'
    }
  }
});

FieldCollection.prototype.model = function(attrs, options) {
  return new attrs.klass(attrs, options);
};

function onFieldSampled(schema, _id, value) {
  process.nextTick(function() {
    var type_id = Type.getNameFromValue(value);
    if (type_id === 'Array') {
      onEmbeddedArray(schema, _id, type_id, value);
    } else if (type_id === 'Object') {
      onEmbeddedDocument(schema, _id, type_id, value);
    } else {
      onBasicField(schema, _id, type_id, value);
    }
  });
}

function onBasicField(schema, _id, type_id, value) {
  process.nextTick(function() {
    var field = schema.fields.get(_id);
    if (!field) {
      field = schema.fields.add({
        _id: _id,
        klass: BasicField,
        parent: schema
      });
    }

    var type = field.types.get(type_id);
    if (!type) {
      type = field.types.add({
        _id: type_id,

      });
    }
    if (!type.values) return console.warn('wtf? type has no values?', type);

    type.values.add({
      _id: value
    });
  });
}

function onEmbeddedArray(schema, _id, type_id, value) {
  var field = schema.fields.get(_id);

  if (!field) {
    field = schema.fields.add({
      _id: _id,
      klass: EmbeddedArrayField,
      parent: schema
    });
  }

  field.count += 1;
  _.each(value, function(d) {
    var type_id = Type.getNameFromValue(d);
    if (type_id === 'Object') {
      _.each(d, function(val, key) {
        onBasicField(field, key, Type.getNameFromValue(val), val);
      });
    } else {
      onBasicField(field, '__basic__', type_id, d);
    }
  });
}

function onEmbeddedDocument(schema, _id, type_id, value) {
  var field = schema.fields.get(_id);

  if (!field) {
    field = schema.fields.add({
      _id: _id,
      klass: EmbeddedDocumentField,
      parent: schema
    });
  }
  field.count += 1;
  _.each(_.pairs(value), function(d) {
    onFieldSampled(field, d[0], d[1]);
  });
}

var Schema = State.extend({
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
  sample: function(doc) {
    var schema = this;
    schema.count += 1;
    _.each(_.pairs(doc), function(d) {
      onFieldSampled(schema, d[0], d[1]);
    });

  },
  stream: function() {
    var schema = this;
    return es.through(function(doc) {
      schema.sample(doc);
      this.emit('data', doc);
    }, function() {
        debug('finalized schema is', JSON.stringify(schema, null, 2));
        this.emit('end');
      });
  }
});

module.exports = Schema;
module.exports.FieldCollection = FieldCollection;
module.exports.BasicField = BasicField;
module.exports.EmbeddedArrayField = EmbeddedArrayField;
module.exports.EmbeddedDocumentField = EmbeddedDocumentField;
