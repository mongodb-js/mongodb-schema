var State = require('ampersand-state');

module.exports = State.extend({
  idAttribute: 'id',
  props: {
    id: {
      type: 'string'
    },
    value: {
      type: 'any'
    }
  },
  initialize: function(attrs) {
    this.value = attrs.value;
    this.id = this.cid + '-' + attrs.value;
  }
});
