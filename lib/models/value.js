var AmpersandState = require('ampersand-state');

module.exports = AmpersandState.extend({
  props: {
    _id: {
      type: 'string',
      required: true,
      default: 'Unknown'
    },
    count: {
      type: 'number',
      default: 0
    }
  }
});
