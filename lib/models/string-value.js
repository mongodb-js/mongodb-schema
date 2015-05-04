module.exports = require('./value').extend({
  props: {
    _id: {
      default: 'String'
    },
    unique: {
      type: 'number',
      default: 0
    },
    values: {
      type: 'array',
      default: function() {
        return [];
      }
    }
  }
});
