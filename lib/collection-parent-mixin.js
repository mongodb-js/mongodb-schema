var _ = require('lodash');
var AmpersandCollection = require('ampersand-collection');

/**
 * Collection with this mixin passes its parent down to its values
 */
module.exports = {
  set: function(models, options) {
    options = _.defaults({
      parent: this.parent
    }, options || {});
    return AmpersandCollection.prototype.set.call(this, models, options);
  }
};
