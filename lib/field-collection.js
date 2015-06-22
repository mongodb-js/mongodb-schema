var Collection = require('./collection');

/**
 * Container for a list of Fields.
 */
var FieldCollection = Collection.extend({
  model: function(attrs, options) {
    return new attrs.klass(attrs, options);
  }
});
module.exports = FieldCollection;
