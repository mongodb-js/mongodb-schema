var AmpersandCollection = require('ampersand-collection');
var type = require('./type');

module.exports = AmpersandCollection.extend({
  mainIndex: '_id',
  model: function(attrs, options) {
    var Klass = type[attrs._id];

    if (!Klass) {
      throw new TypeError('No value type for ' + attrs._id);
    }

    return new Klass({}, options);
  }
});
