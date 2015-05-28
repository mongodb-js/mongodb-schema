var es = require('event-stream');
var _ = require('lodash');
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
    var field = this;
    this.types.on('add', function(type) {
      type.values.on('add', function(value) {
        field.values.add(value);
      });
    });
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
  commit: function() {
    this._updateUndefined();
    this.types.map(function(type) {
      type.probability = type.count / this.total;
      type.unique = _.unique(type.values.pluck('value')).length;
    }.bind(this));
    this.unique = _.sum(this.types.pluck('unique'));

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
    done();
  },
  stream: function() {
    var schema = this;
    return es.map(function(doc, done) {
      setTimeout(function() {
        schema.parse(doc, function(err) {
          done(err, doc);
        });
      }, 500);
    });
  }
});

module.exports = Schema;
module.exports.FieldCollection = FieldCollection;
module.exports.BasicField = BasicField;
module.exports.EmbeddedArrayField = EmbeddedArrayField;
module.exports.EmbeddedDocumentField = EmbeddedDocumentField;
