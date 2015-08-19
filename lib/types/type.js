var _ = require('lodash');
var AmpersandState = require('ampersand-state');

/**
 * Generic Type superclass has name, count, probability properties
 */
var Type = AmpersandState.extend({
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
    parent: 'state',
    path: 'string'
  },
  derived: {
    modelType: {
      fn: function() {
        return this.name;
      }
    },
    probability: {
      deps: ['parent.total_count', 'parent.count'],
      fn: function calculate_type_probability() {
        if (!this.parent) {
          return undefined;
        }
        var res = -1;
        var divisor = this.parent.total_count || this.parent.count;
        if (divisor === 0) {
          res = 0;
        } else if (this.count === 0) {
          /**
           * `TypeCollection` wants probability for initial indexing
           * because of `indexes: ['probability']` on `TypeCollection`.
           *
           * The call stack to get here looks something like:
           *
           *   1. FieldCollection#addToField
           *   2. TypeCollection#addToType
           *   3. ampersand-collection#add
           *   4. ampersand-collection#set
           *   5. ampersand-collection#_addReference
           *   6. ampersand-collection#_index
           *   7. calculate_type_probability() <-- You are here.
           */
          res = this.count + 1 / divisor;
        // debug('P = (%d+1)/%d = %d', this.count, divisor, res.toFixed(2));
        } else {
          res = this.count / divisor;
          // debug('P = %d/%d = %d', this.count, divisor, res.toFixed(2));
        }
        return res;
      }
    }
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

module.exports = Type;
