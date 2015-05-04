var AmpersandCollection = require('ampersand-collection');

// @todo: dedupe by finally breaking types.js out of mongodb-extended-json.
var TYPED_STATES = {
  'Number': require('./number-value'),
  'String': require('./string-value')
};

module.exports = AmpersandCollection.extend({
  model: function(val, options) {
    var T = (val && val._bsonType) || Object.prototype.toString.call(val).replace(/\[object (\w+)\]/, '');
    var Klass = TYPED_STATES[T];

    if (!Klass) {
      throw new TypeError('No value type for ' + T);
    }
    return new Klass({
      value: val
    }, options);
  }
});
