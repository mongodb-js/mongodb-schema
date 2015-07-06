var Collection = require('ampersand-collection');
var lodashMixin = require('ampersand-collection-lodash-mixin');
var parentMixin = require('./collection-parent-mixin');
var Value = require('./value');

/**
 * Value Collection, stores any values wrapped in `Value` state
 * and serializes back to its pure array form.
 * @see Value
 */
module.exports = Collection.extend(lodashMixin, parentMixin, {
  modelType: 'ValueCollection',
  mainIndex: 'id',
  model: Value,
  serialize: function() {
    return this.pluck('value');
  }
});
