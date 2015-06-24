var State = require('./state');
var _ = require('lodash');
var ValueCollection = require('./value-collection');

var Type = State.extend({
  props: {
    _id: {
      type: 'string'
    },
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
    }
  },
  collections: {
    values: ValueCollection
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

exports.Long = Type.extend({
  props: {
    _id: {
      default: 'Long'
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

exports.Timestamp = Type.extend({
  props: {
    _id: {
      default: 'Timestamp'
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

exports.Binary = Type.extend({
  props: {
    _id: {
      default: 'Binary'
    }
  }
});

exports.MaxKey = Type.extend({
  props: {
    _id: {
      default: 'MaxKey'
    }
  }
});

exports.MinKey = Type.extend({
  props: {
    _id: {
      default: 'MinKey'
    }
  }
});

exports.Object = Type.extend({
  props: {
    _id: {
      type: 'string',
      default: 'Object'
    }
  }
});

exports.Array = Type.extend({
  props: {
    _id: {
      type: 'string',
      default: 'Array'
    }
  }
});
