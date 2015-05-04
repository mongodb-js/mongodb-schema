var AmpersandState = require('ampersand-state');
var _ = require('lodash');

module.exports = AmpersandState.extend({
  idAttribute: '_id',
  props: {
    _id: {
      type: 'string'
    },
    count: {
      type: 'number',
      default: 1
    },
    values: {
      type: 'array',
      default: function() {
        return [];
      }
    }
  },
  derived: {
    unique: {
      deps: ['values', 'count'],
      fn: function() {
        return _.unique(this.values).length;
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
    if (options.value) {
      this.values.push(options.value);
    }
  },
  serialize: function() {
    return this.getAttributes({
      props: true,
      derived: true
    }, true);
  }
});
