var Type = require('./type');

/**
 * Types that do not need to store any values
 */
var ConstantType = Type.extend({
  derived: {
    unique: {
      deps: ['count'],
      fn: function() {
        // more than 1 constant value means no longer unique
        return Math.min(this.count, 1);
      }
    }
  }
});

module.exports.Null = ConstantType.extend({
  props: {
    name: {
      default: 'Null'
    }
  }
});

module.exports.Undefined = ConstantType.extend({
  props: {
    name: {
      default: 'Undefined'
    }
  },
  derived: {
    unique: {
      fn: function() {
        // undefined does not count as a value
        return 0;
      }
    }
  }
});

/**
 * @see http://mongodb.github.io/node-mongodb-native/2.0/api/MaxKey.html
 */
module.exports.MaxKey = ConstantType.extend({
  props: {
    name: {
      default: 'MaxKey'
    }
  }
});

/**
 * @see http://mongodb.github.io/node-mongodb-native/2.0/api/MinKey.html
 */
module.exports.MinKey = ConstantType.extend({
  props: {
    name: {
      default: 'MinKey'
    }
  }
});
