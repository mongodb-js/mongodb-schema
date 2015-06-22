var State = require('./state');

module.exports = State.extend({
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
    this._id = this.cid + '-' + attrs._id;
  }
});
