var _ = require('lodash');
var AmpersandState = require('ampersand-state');
/**
 * Generic Type superclass has name, count, probability properties
 */
module.exports = AmpersandState.extend({
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
    modelType: {
      fn: function () {
        return this.name;
      }
    },
    probability: {
      deps: ['count', 'parent.count', 'parent.total_count'],
      fn: function () {
        if (!this.parent) return undefined;
        return this.count / (this.parent.total_count || this.parent.count);
      }
    },
  },
  parse: function() {
    this.count += 1;
  },
  serialize: function() {
    var res = this.getAttributes({
      props: true,
      derived: true
    }, true);
    if (this.values) {
      res.values = this.values.serialize();
    }
    res = _.omit(res, 'modelType');
    return res;
  }
});
