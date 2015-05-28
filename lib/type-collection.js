var Collection = require('./collection');
var type = require('./type');

module.exports = Collection.extend({
  model: function(attrs, options) {
    var Klass = type[attrs._id];

    if (!Klass) {
      throw new TypeError('No value type for ' + attrs._id);
    }

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
