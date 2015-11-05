var Collection = require('ampersand-collection');
var lodashMixin = require('ampersand-collection-lodash-mixin');
var parentMixin = require('./collection-parent-mixin');
var Field = require('./field');

/**
 * Container for a list of Fields.
 */
var FieldCollection = Collection.extend(lodashMixin, parentMixin, {
  modelType: 'FieldCollection',
  mainIndex: 'name',
  model: Field,
  comparator: function(a, b) {
    // make sure _id is always at top, even in presence of uppercase fields
    var aId = a.getId();
    var bId = b.getId();
    if (aId === '_id') {
      return -1;
    }
    if (bId === '_id') {
      return 1;
    }
    // otherwise sort case-insensitively
    return aId.toLowerCase() < bId.toLowerCase() ? -1 : 1;
  },
  /**
   * adds a new name/value pair to the correct field, and creates the
   * field first if it doesn't exist yet. Leave it to field.types to
   * add the value.
   *
   * @param {String} name - Name of the field.
   * @param {Any} value - Value to be added.
   */
  addToField: function(name, value) {
    // get or create field
    var field = this.get(name);
    if (!field) {
      var path = this.parent && this.parent.path ? this.parent.path + '.' + name : name;
      field = this.add({
        name: name,
        path: path,
        parent: this.parent
      });
      if (this.parent) {
        this.parent.trigger('change:fields.length');
      }
      /**
       * The first time we see this field, we need to compensate for
       * the `Undefined` values we missed so far by setting `count` relative
       * to `parent.count and adjusting `total_count` as well.
       */
      if (this.parent && this.parent.count > 0) {
        var undef = field.types.add({
          name: 'Undefined'
        });
        undef.count += this.parent.count;
        field.total_count += undef.count;
      }
    }
    /**
     * Silently update the field's `total_count` and `count` silently
     * so `Type#probability` isn't calculated needlessly when it doesn't
     * have the neccessary state to do so.  This prevents an
     * extra `change:probability` event from being triggered and confusing
     * everybody wildly.
     */
    var updates = {};
    // Undefined are not counted towards the field's `count`
    if (value !== undefined) {
      updates.count = field.count + 1;
    }
    // But they are counted towards the field's `total_count`
    updates.total_count = field.total_count + 1;
    field.set(updates, {
      silent: true
    });
    // Insert or update the fields type collection
    field.types.addToType(value);

    // Manually trigger change so `Type#probability`is recalculated
    // if need be.
    field.trigger('change:total_count', field.total_count);
  }
});

module.exports = FieldCollection;
