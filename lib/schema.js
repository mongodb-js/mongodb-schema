var State = require('ampersand-state');
var Collection = require('ampersand-collection').extend(require('ampersand-collection-lodash-mixin'));
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
    has_children: {
      type: 'boolean',
      default: false
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
    description: 'string'
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
      type.values.on('add', function(value) {
        field.count += 1;
        type.count += 1;
        field.values.add(value);
      });
    });

    this.fields.on('add', function() {
      this.has_children = true;
    }.bind(this));
  }
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
      default: 'array'
    }
  }
});

var EmbeddedDocumentField = Field.extend({
  props: {
    type: {
      type: 'string',
      default: 'object'
    }
  }
});

FieldCollection.prototype.model = function(attrs, options) {
  return new attrs.klass(attrs, options);
};

function onFieldSampled(schema, _id, value) {
  var type_id = Type.getNameFromValue(value);
  if (type_id === 'Array') {
    onEmbeddedArray(schema, _id, type_id, value);
  } else if (type_id === 'Object') {
    onEmbeddedDocument(schema, _id, type_id, value);
  } else {
    onBasicField(schema, _id, type_id, value);
  }
}

function onEmbeddedDocument(schema, _id, type_id, value) {
  var field = schema.fields.get(_id);

  if (!field) {
    debug('`%s` is a new field with type %s', _id, type_id);
    field = schema.fields.add({
      _id: _id,
      klass: EmbeddedDocumentField
    });
  }
  field.count += 1;
  _.each(_.pairs(value), function(d) {
    onFieldSampled(field, d[0], d[1]);
  });
}

function onBasicField(schema, _id, type_id, value) {
  var field = schema.fields.get(_id);
  if (!field) {
    debug('`%s` is a new field with type %s', _id, type_id);
    field = schema.fields.add({
      _id: _id,
      klass: BasicField
    });
  } else {
    debug('`%s` is an existing field with type %s', _id, field.type);
  }

  var type = field.types.get(type_id);
  if (!type) {
    type = field.types.add({
      _id: type_id
    });
  }

  type.values.add({
    _id: value
  });
}

function onEmbeddedArray(schema, _id, type_id, value) {
  var field = schema.fields.get(_id);

  if (!field) {
    debug('`%s` is a new field with type %s', _id, type_id);
    field = schema.fields.add({
      _id: _id,
      klass: EmbeddedArrayField
    });
  }
  field.count += 1;
  debug('value is', value);
  // _.each(value, function(d) {
  //   onFieldSampled(field, _id, d);
  // });
}

var Schema = State.extend({
  idAttribute: 'ns',
  props: {
    ns: {
      type: 'string'
    },
  },
  collections: {
    fields: FieldCollection
  },
  sample: function(doc) {
    var schema = this;
    debug('--- begin sample');
    _.each(_.pairs(doc), function(d) {
      onFieldSampled(schema, d[0], d[1]);
    });
    debug('--- end sample');
  },
  stream: function() {
    var schema = this;
    return es.through(function(doc) {
      debug('updating based on %j', doc);
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
