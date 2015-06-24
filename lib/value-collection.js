var Collection = require('ampersand-collection');
var lodashMixin = require('ampersand-collection-lodash-mixin');
var Value = require('./value');

module.exports = Collection.extend(lodashMixin, {
  mainIndex: 'id',
  model: Value,
  serialize: function() {
    return this.pluck('value');
  }
});
