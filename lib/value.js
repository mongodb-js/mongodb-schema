var AmpersandState = require('ampersand-state');

module.exports = AmpersandState.extend({
  _idAttribute: '_id',
  props: {
    _id: {
      type: 'any'
    },
    value: {
      type: 'any'
    }
  },
  initialize: function(attrs) {
    this.value = attrs._id;
    this._id = '' + attrs._id;
  }
});
