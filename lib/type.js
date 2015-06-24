var State = require('ampersand-state');
var _ = require('lodash');
var ValueCollection = require('./value-collection');

var Type = State.extend({
  idAttribute: 'name',
  props: {
    name: {
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
    name: {
      default: 'String'
    }
  }
});

exports.Number = Type.extend({
  props: {
    name: {
      default: 'Number'
    }
  }
});

exports.Long = Type.extend({
  props: {
    name: {
      default: 'Long'
    }
  }
});

exports.Null = Type.extend({
  props: {
    name: {
      default: 'Null'
    }
  }
});

exports.Timestamp = Type.extend({
  props: {
    name: {
      default: 'Timestamp'
    }
  }
});

exports.Boolean = Type.extend({
  props: {
    name: {
      default: 'Boolean'
    }
  }
});

exports.Date = Type.extend({
  props: {
    name: {
      default: 'Date'
    }
  }
});

exports.ObjectID = Type.extend({
  props: {
    name: {
      default: 'ObjectID'
    }
  }
});

exports.Undefined = Type.extend({
  props: {
    name: {
      default: 'Undefined'
    }
  }
});

exports.Binary = Type.extend({
  props: {
    name: {
      default: 'Binary'
    }
  }
});

exports.MaxKey = Type.extend({
  props: {
    name: {
      default: 'MaxKey'
    }
  }
});

exports.MinKey = Type.extend({
  props: {
    name: {
      default: 'MinKey'
    }
  }
});

exports.Object = Type.extend({
  props: {
    name: {
      type: 'string',
      default: 'Object'
    }
  }
});

exports.Array = Type.extend({
  props: {
    name: {
      type: 'string',
      default: 'Array'
    }
  }
});
