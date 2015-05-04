var AmpersandCollection = require('ampersand-collection');

// @todo: dedupe by finally breaking types.js out of mongodb-extended-json.
var TYPED_STATES = {
  'Number': require('./type-number'),
  'String': require('./type-string')
};

module.exports = AmpersandCollection.extend({
  mainIndex: '_id',
  model: function(attrs, options) {
    if (attrs && Object.keys(attrs).length === 0) return;

    var val = attrs.value;
    var T = (val && val._bsonType) || Object.prototype.toString.call(val).replace(/\[object (\w+)\]/, '$1');
    var Klass = TYPED_STATES[T];

    if (!Klass) {
      throw new TypeError('No value type for ' + T);
    }
    return new Klass({
      value: val
    }, options);
  }
});
