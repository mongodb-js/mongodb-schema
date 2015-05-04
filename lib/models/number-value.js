module.exports = require('./value').extend({
  props: {
    _id: {
      default: 'Number'
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
