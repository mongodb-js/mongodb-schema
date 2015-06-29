var Collection = require('ampersand-collection');
var lodashMixin = require('ampersand-collection-lodash-mixin');
var parentMixin = require('./collection-parent-mixin');
var assert = require('assert');
var _ = require('lodash');
var debug = require('debug')('mongodb-schema:type-collection');

/**
 * Helper function to get the type name given a value
 * @param  {Any} value   value to get type for
 * @return {String}      type name, e.g. Boolean or ObjectID
 */
var getTypeName = function (value) {
  var T;
  if (_.has(value, '_bsontype')) {
    T = value._bsontype;
  } else {
    T = Object.prototype.toString.call(value).replace(/\[object (\w+)\]/, '$1');
  }
  // don't want to create naming conflict with javascript Object
  if (T === 'Object') T = 'Document';
  return T;
};


module.exports = Collection.extend(lodashMixin, parentMixin, {
  namespace: 'TypeCollection',
  mainIndex: 'name',
  /**
   * Sort by probability descending, with Undefined always last.
   * Note that the application has to call collection.sort() explicitly;
   * it will not be sorted automatically for performance reasons.
   */
  comparator: function(model) {
    if (model.getId() === 'Undefined') return 0;
    return model.probability * -1;
  },
  model: function(attrs, options) {
    // require ./type at runtime to avoid circular imports, does this work with browserify??
    var Klass = require('./type')[attrs.name];
    assert(Klass, 'No value type for ' + attrs.name);
    return new Klass(attrs, options);
  },
  isModel: function(model) {
    // require ./type at runtime to avoid circular imports, does this work with browserify??
    return (model instanceof require('./type').Type);
  },
  /**
   * adds a new value to the correct type, and creates the type first
   * if it doesn't exist yet.
   *
   * @param {Any} value   value to be added
   */
  addToType: function(value) {
    var typeName = getTypeName(value);
    // get or create type
    var type = this.get(typeName);
    if (!type) {
      type = this.add({
        name: typeName
      });
      if (this.parent) this.parent.trigger('change:types.length');
    }
    // leave it to type to add the value
    type.parse(value);
  },
  serialize: function() {
    this.sort();
    return Collection.prototype.serialize.call(this);
  }
});
