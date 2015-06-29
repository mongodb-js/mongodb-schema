var Collection = require('ampersand-collection');
var lodashMixin = require('ampersand-collection-lodash-mixin');
var parentMixin = require('./collection-parent-mixin');
var Value = require('./value');

module.exports = Collection.extend(lodashMixin, parentMixin, {
  namespace: 'ValueCollection',
  mainIndex: 'id',
  model: Value,
  serialize: function() {
    return this.pluck('value');
  }
});
