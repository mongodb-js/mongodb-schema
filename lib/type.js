var State = require('ampersand-state');
var _ = require('lodash');
var ValueCollection = require('./value-collection');

var Type = State.extend({
  idAttribute: '_id',
  props: {
    _id: {
      type: 'string'
    },
    count: {
      type: 'number',
      default: 0
    }
  },
  collections: {
    values: ValueCollection
  },
  derived: {
    unique: {
      deps: ['count'],
      fn: function() {
        return _.unique(this.values.models).length;
      }
    },
    probability: {
      deps: ['count', 'collection.parent.parent'],
      fn: function() {
        var field = this.collection.parent;
        var schema = field.parent;
        return this.count / schema.count;
      }
    }
  },
  serialize: function() {
    return this.getAttributes({
      props: true,
      derived: true
    }, true);
  }
});

exports.getNameFromValue = function(value) {
  var T;
  if (_.has(value, '_bsontype')) {
    T = value._bsontype;
  } else {
    T = Object.prototype.toString.call(value).replace(/\[object (\w+)\]/, '$1');
  }
  return T;
};

exports.String = Type.extend({
  props: {
    _id: {
      default: 'String'
    }
  }
});

exports.Number = Type.extend({
  props: {
    _id: {
      default: 'Number'
    }
  }
});

exports.Null = Type.extend({
  props: {
    _id: {
      default: 'Null'
    }
  }
});

exports.Boolean = Type.extend({
  props: {
    _id: {
      default: 'Boolean'
    }
  }
});

exports.Date = Type.extend({
  props: {
    _id: {
      default: 'Date'
    }
  }
});

exports.ObjectID = Type.extend({
  props: {
    _id: {
      default: 'ObjectID'
    }
  }
});

exports.Undefined = Type.extend({
  props: {
    _id: {
      default: 'Undefined'
    }
  }
});

exports.Object = State.extend({
  idAttribute: '_id',
  props: {
    _id: {
      type: 'string',
      default: 'Object'
    }
  }
});

exports.Array = State.extend({
  idAttribute: '_id',
  props: {
    _id: {
      type: 'string',
      default: 'Array'
    }
  }
});

