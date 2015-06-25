var _ = require('lodash');
var AmpersandCollection = require('ampersand-collection');

module.exports = {
  set: function (models, options) {
    // set model parent to collection's parent
    options = _.defaults({
      parent: this.parent
    }, options || {});
    return AmpersandCollection.prototype.set.call(this, models, options);
  }
};
