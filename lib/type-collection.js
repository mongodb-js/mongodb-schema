var AmpersandCollection = require('ampersand-collection');
var type = require('./type');

module.exports = AmpersandCollection.extend({
  mainIndex: '_id',
  model: function(attrs, options) {
    if (attrs && Object.keys(attrs).length === 0) return;

    var Klass = type[attrs._id];

    if (!Klass) {
      throw new TypeError('No value type for ' + attrs._id);
    }

    return new Klass({}, options);
  }
});
