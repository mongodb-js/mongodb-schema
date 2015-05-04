var AmpersandState = require('ampersand-state');
var ValueCollection = require('./value-collection');

module.exports = AmpersandState.extend({
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
    }
  },
  children: {
    types: ValueCollection
  }
});
