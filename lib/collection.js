var lodashMixin = require('ampersand-collection-lodash-mixin');
var Collection = require('ampersand-collection');

module.exports = Collection.extend(lodashMixin, {
  mainIndex: '_id',
  comparator: '_id'
});
