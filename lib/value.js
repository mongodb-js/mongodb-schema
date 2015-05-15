var AmpersandState = require('ampersand-state');

module.exports = AmpersandState.extend({
  _idAttribute: '_id',
  props: {
    _id: {
      type: 'any'
    }
  },
  initialize: function(val) {
    this._id = val;
  }
});
