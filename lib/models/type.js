var AmpersandState = require('ampersand-state');
var _ = require('lodash');
var ValueCollection = require('./value-collection');
var TypeCollection = require('./type-collection');

var Type = AmpersandState.extend({
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
      deps: ['count'],
      fn: function() {
        var field = this.collection.parent;
        return this.count / field.count;
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

exports.Object = AmpersandState.extend({
  idAttribute: '_id',
  props: {
    _id: {
      type: 'string',
      default: 'Object'
    }
  }
});

exports.Array = AmpersandState.extend({
  idAttribute: '_id',
  props: {
    _id: {
      type: 'string',
      default: 'Array'
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

