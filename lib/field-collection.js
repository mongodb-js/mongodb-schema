var Collection = require('ampersand-collection');
var lodashMixin = require('ampersand-collection-lodash-mixin');
var parentMixin = require('./collection-parent-mixin');
var Field = require('./field');
var debug = require('debug')('mongodb-schema:field-collection');

/**
 * Container for a list of Fields.
 */
var FieldCollection = Collection.extend(lodashMixin, parentMixin, {
  namespace: 'FieldCollection',
  mainIndex: 'name',
  model: Field,
  comparator: function (a, b) {
    // make sure _id is always at top, even in presence of uppercase fields
    var aId = a.getId();
    var bId = b.getId();
    if (aId === '_id') return -1;
    if (bId === '_id') return 1;
    // otherwise sort case-insensitively
    return (aId.toLowerCase() < bId.toLowerCase()) ? -1 : 1;
  },
  /**
   * adds a new name/value pair to the correct field, and creates the
   * field first if it doesn't exist yet. Leave it to field.types to
   * add the value.
   *
   * @param {String} name   name of the field
   * @param {Any} value     value to be added
   */
  addToField: function (name, value) {
    // get or create field
    var field = this.get(name);
    if (!field) {
      field = this.add({
        name: name,
        parent: this.parent
      });
      if (this.parent) this.parent.trigger('change:fields.length');
      /**
       * first time we see this field. We need to compensate for
       * the Undefined values we missed so far for this field,
       * by setting the count to the parent count.
       */
      if (this.parent && this.parent.count > 0) {
        var undef = field.types.add({name: 'Undefined'});
        undef.count += this.parent.count;
      }
    }
    // undefined are not counted towards the field's count
    if(value !== undefined) field.count += 1;
    // but they are counted towards the field's total_count
    field.total_count += 1;
    field.types.addToType(value);
  }
});

module.exports = FieldCollection;
