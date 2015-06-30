var State = require('ampersand-state');

/**
 * Value, wrapper for any value found in documents.
 */
module.exports = State.extend({
  modelType: 'Value',
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
