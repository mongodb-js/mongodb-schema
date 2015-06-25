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
  derived: {
    className: {
      fn: function () {
        return this.name;
      }
    },
    probability: {
      // deps: ['count', 'parent.count'],
      cache: false,
      fn: function () {
        if (!this.parent) return null;
        return this.count / this.parent.count;
      }
    },
  },
  parse: function() {
    this.count += 1;
  }
});


/**
 * Constant types are just generic types with the appropriate name.
 * They do not store any values.
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

exports.MaxKey = ConstantType.extend({
  props: {
    name: {
      default: 'MaxKey'
    }
  }
});

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

exports.Double = PrimitiveType.extend({
  props: {
    name: {
      default: 'Double'
    }
  }
});

exports.Long = PrimitiveType.extend({
  props: {
    name: {
      default: 'Long'
    }
  }
});

exports.Timestamp = PrimitiveType.extend({
  props: {
    name: {
      default: 'Timestamp'
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

exports.ObjectID = PrimitiveType.extend({
  props: {
    name: {
      default: 'ObjectID'
    }
  }
});

exports.Binary = PrimitiveType.extend({
  props: {
    name: {
      default: 'Binary'
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

exports.Symbol = PrimitiveType.extend({
  props: {
    name: {
      default: 'Symbol'
    }
  }
});

exports.Code = PrimitiveType.extend({
  props: {
    name: {
      default: 'Code'
    }
  }
});

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

    _.each(obj, function(val, key) {
      this.fields.addToField(key, val);
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
    average_length: {
      deps: ['lengths'],
      fn: function() {
        return _.sum(this.lengths) / this.lengths.length;
      }
    }
  },
  parse: function(arr) {
    assert(_.isArray(arr), format('value must be array, got `%s`', arr));

    _.each(arr, function (val) {
      this.types.addToType(val);
    }.bind(this));

    this.count += 1;
  },
  collections: {
    types: TypeCollection
  }
});

