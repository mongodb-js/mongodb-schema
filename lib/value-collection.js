var Collection = require('ampersand-collection').extend(require('ampersand-collection-lodash-mixin'));
var Value = require('./value');

module.exports = Collection.extend({
  model: Value,
  serialize: function() {
    return this.pluck('value');
  }
});
