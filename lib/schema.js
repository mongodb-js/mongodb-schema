var es = require('event-stream');
var _ = require('lodash');
var raf = require('raf');

var Collection = require('./collection');
var State = require('./state');
var Type = require('./type');
var TypeCollection = require('./type-collection');
var ValueCollection = require('./value-collection');
var debug = require('debug')('mongodb-schema');
var FieldCollection = Collection.extend({});

var Field = State.extend({
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
    probability: {
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
      deps: ['types.length'],
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
    total: {
      deps: ['count', 'probability'],
      fn: function() {
        if (this.probability === 1) return this.count;
        return (this.count / this.probability);
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
    this.listenTo(this.types, 'add', this.onTypeAdded);
    this.listenTo(this.types, 'remove', this.onTypeRemoved);
    this.listenTo(this.types, 'reset refresh', this.onTypeReset);
  },
  /**
   * When new types are added, trigger a change event to recalculate `this.type`
   * and add listeners so any operations on `type.values` are relfected on
   * `this.values`.
   *
   * @oaram {Type} type that's being added.
   * @oaram {TypeCollection} collection the type was added to.
   * @param {Object} options
   */
  onTypeAdded: function(type) {
    /**
     * Currently have to manually trigger events on collections so
     * derived properties are recalculated at the right time.
     * In this case, triggering `change:types.length` will cause
     * the `type` property to be recalculated correctly.
     */
    this.trigger('change:types.length');
    this.listenTo(type.values, 'add', this.onValueAdded);
    this.listenTo(type.values, 'remove', this.onValueRemoved);
    this.listenTo(type.values, 'reset', this.onValueReset);
  },
  /**
   * @see Schema#onTypeAdded
   *
   * @oaram {Type} type being removed.
   * @oaram {TypeCollection} collection it was removed from.
   * @param {Object} options
   */
  onTypeRemoved: function(type) {
    this.trigger('change:types.length');
    this.stopListening(type.values, 'add', this.onValueAdded);
    this.stopListening(type.values, 'remove', this.onValueRemoved);
    this.stopListening(type.values, 'reset', this.onValueReset);
  },
  onTypeReset: function() {
    this.trigger('change:types.length');
  },
  /**
   * @oaram {ValueCollection} collection the value was added to.
   * @oaram {Value} value being added.
   * @param {Object} options
   */
  onValueAdded: function(value) {
    this.values.add(value);
  },
  /**
   * @oaram {ValueCollection} collection the value was removed from.
   * @oaram {Value} value being removed.
   * @param {Object} options
   */
  onValueRemoved: function(value) {
    this.values.remove(value);
  },
  onValueReset: function() {
    this.values.reset();
  },
  _updateUndefined: function() {
    var newprob = this.count / this.parent.count;
    if (newprob !== this.probability) {
      this.probability = newprob;
    }
    var undef = this.types.get('Undefined');
    if ((this.total - this.count) <= 0) {
      if (undef) {
        debug('removing extraneous Undefined for `%s`', this.getId());
        this.types.remove({
          _id: 'Undefined'
        });
      }
      return;
    }

    if (!undef) {
      debug('adding Undefined for `%s`', this.getId());
      undef = this.types.add({
        _id: 'Undefined',
        unique: 1
      });
    }

    undef.count = (this.total - this.count);
    undef.probability = (undef.count - this.count);
  },
  /**
   * We've finished parsing a new document! Finalize all of the probabilities
   * and make sure all of our child collections are nicely sorted.
   * If we have any subfields, call `commit()` on each of those as well.
   */
  commit: function() {
    this._updateUndefined();
    this.types.map(function(type) {
      type.probability = type.count / this.total;
      type.unique = _.unique(type.values.pluck('value')).length;
    }.bind(this));
    this.unique = _.sum(this.types.pluck('unique'));
    this.types.sort();

    if (this.fields.length > 0) {
      this.fields.map(function(field) {
        field.commit();
      });
    }
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
  var type_id = Type.getNameFromValue(value);
  if (type_id === 'Array') {
    onEmbeddedArray(schema, _id, type_id, value);
  } else if (type_id === 'Object') {
    onEmbeddedDocument(schema, _id, type_id, value);
  } else {
    onBasicField(schema, _id, type_id, value);
  }
}

function onBasicField(schema, _id, type_id, value) {
  var field = schema.fields.get(_id);
  if (!field) {
    field = schema.fields.add({
      _id: _id,
      klass: BasicField,
      parent: schema
    });
  }
  field.count += 1;

  var type = field.types.get(type_id);
  if (!type) {
    type = field.types.add({
      _id: type_id,
    });
  }
  type.count += 1;

  type.values.add({
    _id: value
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
  _.each(value, function(val, key) {
    onFieldSampled(field, key, val);
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
  parse: function(doc, done) {
    var schema = this;
    schema.count += 1;
    _.each(doc, function(val, key) {
      onFieldSampled(schema, key, val);
    });
    schema.fields.map(function(field) {
      field.commit();
    });
    if (_.isFunction(done)) {
      done();
    }
  },
  stream: function() {
    var schema = this;
    return es.map(function(doc, done) {
      raf(function() {
        schema.parse(doc, function(err) {
          done(err, doc);
        });
      });
    });
  }
});

module.exports = Schema;
module.exports.FieldCollection = FieldCollection;
module.exports.BasicField = BasicField;
module.exports.EmbeddedArrayField = EmbeddedArrayField;
module.exports.EmbeddedDocumentField = EmbeddedDocumentField;
