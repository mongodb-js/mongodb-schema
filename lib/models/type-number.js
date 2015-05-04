var _ = require('lodash');

module.exports = require('./type').extend({
  props: {
    _id: {
      default: 'Number'
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
    }
  }
});
