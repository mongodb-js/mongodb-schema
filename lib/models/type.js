var AmpersandState = require('ampersand-state');
var _ = require('lodash');
var ValueCollection = require('./value-collection');

var Type = AmpersandState.extend({
  idAttribute: '_id',
  props: {
    _id: {
      type: 'string'
    },
    count: {
      type: 'number',
      default: 1
    }
  },
  collections: {
    values: ValueCollection
  },
  derived: {
    unique: {
      deps: ['values', 'count'],
      fn: function() {
        return _.unique(this.values.models).length;
      }
    },
    probability: {
      deps: ['count'],
      cached: false,
      fn: function() {
        var field = this.collection.parent;
        return this.count / field.count;
      }
    }
  },
  initialize: function(options) {
    if (options.value && this.values) {
      this.values.add(options.value);
    }
  },
  serialize: function() {
    return this.getAttributes({
      props: true,
      derived: true
    }, true);
  }
});

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
