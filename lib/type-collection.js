var AmpersandCollection = require('ampersand-collection');
var type = require('./type');

module.exports = AmpersandCollection.extend({
  mainIndex: '_id',
  model: function(attrs, options) {
    if (attrs && Object.keys(attrs).length === 0) return;

    var val = attrs.value;
    var T = type.getNameFromValue(val);
    var Klass = type[T];

    if (!Klass) {
      throw new TypeError('No value type for ' + T);
    }

    if (!val) {
      val = '' + val;
    }
    return new Klass({
        value: val
      }, options);
  }
});
