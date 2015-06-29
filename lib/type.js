var State = require('ampersand-state');
var _ = require('lodash');
var ValueCollection = require('./value-collection');
var FieldCollection = require('./field-collection');
var TypeCollection = require('./type-collection');
var debug = require('debug')('mongodb-schema:type');
var assert = require('assert');
var format = require('util').format;

/**
 * Generic Type superclass has name, count, probability properties
 */
var Type = exports.Type = State.extend({
  idAttribute: 'name',
  props: {
    name: {
      type: 'string'
    },
    count: {
      type: 'number',
      default: 0
    }
  },
  session: {
    parent: 'state'
  },
  derived: {
    namespace: {
      fn: function () {
        return this.name;
      }
    },
    probability: {
      deps: ['count', 'parent.count', 'parent.total_count'],
      fn: function () {
        if (!this.parent) return null;
        return this.count / (this.parent.total_count || this.parent.count);
      }
    },
  },
  parse: function() {
    this.count += 1;
  }
});


/**
 * Types that do not need to store any values
 */
var ConstantType = exports.ConstantType = Type.extend({});

exports.Null = ConstantType.extend({
  props: {
    name: {
      default: 'Null'
    }
  }
});

exports.Undefined = ConstantType.extend({
  props: {
    name: {
      default: 'Undefined'
    }
  }
});

/**
 * @see http://mongodb.github.io/node-mongodb-native/2.0/api/MaxKey.html
 */
exports.MaxKey = ConstantType.extend({
  props: {
    name: {
      default: 'MaxKey'
    }
  }
});

/**
 * @see http://mongodb.github.io/node-mongodb-native/2.0/api/MinKey.html
 */
exports.MinKey = ConstantType.extend({
  props: {
    name: {
      default: 'MinKey'
    }
  }
});


/**
 * Primitive types store their values and have a .unique counter
 */
var PrimitiveType = exports.PrimitiveType = Type.extend({
  props: {
    unique: {
      type: 'number',
      default: 0
    }
  },
  collections: {
    values: ValueCollection
  },
  /**
   * adds the value to the value collection. Just passing it through.
   * @param {Any} value   value to be added
   */
  parse: function (value) {
    this.values.add({value: value});
    this.count += 1;
  }
});


// --- Native Javascript Types ---

exports.String = PrimitiveType.extend({
  props: {
    name: {
      default: 'String'
    }
  }
});

exports.Number = PrimitiveType.extend({
  props: {
    name: {
      default: 'Number'
    }
  }
});

exports.Boolean = PrimitiveType.extend({
  props: {
    name: {
      default: 'Boolean'
    }
  }
});

exports.Date = PrimitiveType.extend({
  props: {
    name: {
      default: 'Date'
    }
  }
});

exports.RegExp = PrimitiveType.extend({
  props: {
    name: {
      default: 'RegExp'
    }
  }
});

// --- BSON Types ---

/**
 * @see http://mongodb.github.io/node-mongodb-native/2.0/api/Double.html
 */
exports.Double = PrimitiveType.extend({
  props: {
    name: {
      default: 'Double'
    }
  }
});

/**
 * @see http://mongodb.github.io/node-mongodb-native/2.0/api/Long.html
 */
exports.Long = PrimitiveType.extend({
  props: {
    name: {
      default: 'Long'
    }
  }
});

/**
 * @see http://mongodb.github.io/node-mongodb-native/2.0/api/Timestamp.html
 */
exports.Timestamp = PrimitiveType.extend({
  props: {
    name: {
      default: 'Timestamp'
    }
  }
});

/**
 * @see http://mongodb.github.io/node-mongodb-native/2.0/api/ObjectID.html
 */
exports.ObjectID = PrimitiveType.extend({
  props: {
    name: {
      default: 'ObjectID'
    }
  }
});

/**
 * @see http://mongodb.github.io/node-mongodb-native/2.0/api/Binary.html
 */
exports.Binary = PrimitiveType.extend({
  props: {
    name: {
      default: 'Binary'
    }
  }
});

/**
 * @see http://mongodb.github.io/node-mongodb-native/2.0/api/Symbol.html
 */
exports.Symbol = PrimitiveType.extend({
  props: {
    name: {
      default: 'Symbol'
    }
  }
});

/**
 * @see http://mongodb.github.io/node-mongodb-native/2.0/api/Code.html
 */
exports.Code = PrimitiveType.extend({
  props: {
    name: {
      default: 'Code'
    }
  }
});

/**
 * @see http://mongodb.github.io/node-mongodb-native/2.0/api/DBRef.html
 */
exports.DBRef = PrimitiveType.extend({
  props: {
    name: {
      default: 'DBRef'
    }
  }
});

/**
 * Documents have sub-fields stored in .fields
 */
exports.Document = Type.extend({
  props: {
    name: {
      default: 'Document'
    }
  },
  collections: {
    fields: FieldCollection
  },
  /**
   * parse sub-document and add each key/value to this.fields
   * @param {Object} obj  The sub-document to be parsed
   */
  parse: function(obj) {
    // parse sub-document and add to this.fields
    assert(_.isPlainObject(obj), format('value must be object, got `%s`', obj));

    /**
     * this is a nice way to handle the Undefined values. It iterates over the union
     * of object keys and existing field names, automatically inserting undefined
     * for the fields that are not in the current object.
     *
     * Only caveat is that when a field is created for the first time, we need to
     * retrospectively bump up the undefined count. That's taken care of in
     * @see FieldCollection#addToField
     */
    var union = _.union(_.keys(obj), this.fields.pluck('name'));
    _.each(union, function(key) {
      this.fields.addToField(key, obj[key]);
    }.bind(this));

    this.count += 1;
  }
});


/**
 * Arrays have additional .lengths and .average_length properties
 * and group their values in a nested .types collection
 */
module.exports.Array = Type.extend({
  props: {
    name: {
      default: 'Array'
    },
    lengths: {
      type: 'array',
      default: function() {
        return [];
      }
    }
  },
  derived: {
    total_count: {
      cache: false,
      fn: function() {
        return _.sum(this.lengths);
      }
    },
    average_length: {
      deps: ['count'],
      fn: function() {
        return this.total_count / this.count;
      }
    },
    /**
     * Convenience alias to access sub-fields. Returns
     * null if this Field does not have a 'Document' type.
     * @returns {FieldCollection}
     */
    fields: {
      deps: ['types.length'],
      fn: function() {
        var objType = this.types.get('Document');
        return objType ? objType.fields : null;
      }
    }
  },
  parse: function(arr) {
    assert(_.isArray(arr), format('value must be array, got `%s`', arr));

    _.each(arr, function (val) {
      this.types.addToType(val);
    }.bind(this));

    this.lengths.push(arr.length);
    this.count += 1;
  },
  collections: {
    types: TypeCollection
  }
});
