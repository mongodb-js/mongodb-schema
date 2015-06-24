var Collection = require('ampersand-collection');
var lodashMixin = require('ampersand-collection-lodash-mixin');
var type = require('./type');
var assert = require('assert');

module.exports = Collection.extend(lodashMixin, {
  mainIndex: 'name',
  model: function(attrs, options) {
    var Klass = type[attrs.name];
    assert(Klass, 'No value type for ' + attrs.name);
    return new Klass(attrs, options);
  },
  /**
   * Sort by probability descending, with Undefined always last.
   */
  comparator: function(model) {
    if (model.getId() === 'Undefined') return 0;
    return model.probability * -1;
  }
});
