var Collection = require('ampersand-collection').extend(require('ampersand-collection-lodash-mixin'));
var type = require('./type');

module.exports = Collection.extend({
  mainIndex: '_id',
  model: function(attrs, options) {
    var Klass = type[attrs._id];

    if (!Klass) {
      throw new TypeError('No value type for ' + attrs._id);
    }

    return new Klass(attrs, options);
  }
});
