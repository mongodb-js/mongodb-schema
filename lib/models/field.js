var AmpersandState = require('ampersand-state');
var TypeCollection = require('./type-collection');

module.exports = AmpersandState.extend({
  idAttribute: '_id',
  props: {
    _id: {
      type: 'string',
      required: true
    },
    displayName: {
      type: 'string',
      default: function() {
        return this._id;
      }
    },
    description: {
      type: 'string'
    },
    count: {
      type: 'number',
      default: 0
    },
  },
  collections: {
    types: TypeCollection
  }
});
