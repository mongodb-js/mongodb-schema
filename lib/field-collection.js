var Collection = require('ampersand-collection');
var lodashMixin = require('ampersand-collection-lodash-mixin');

/**
 * Container for a list of Fields.
 */
var FieldCollection = Collection.extend(lodashMixin, {
  mainIndex: 'name',
  comparator: function (a, b) {
    // make sure _id is always at top, even in presence of uppercase fields
    var aId = a.getId();
    var bId = b.getId();
    if (aId === '_id') return -1;
    if (bId === '_id') return 1;
    // otherwise sort case-insensitively
    return (aId.toLowerCase() < bId.toLowerCase()) ? -1 : 1;
  },
  model: function(attrs, options) {
    return new attrs.klass(attrs, options);
  }
});
module.exports = FieldCollection;
