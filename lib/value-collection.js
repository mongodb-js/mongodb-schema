var Collection = require('./collection');
var Value = require('./value');

module.exports = Collection.extend({
  model: Value,
  serialize: function() {
    return this.pluck('value');
  }
});
