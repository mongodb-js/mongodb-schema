var Type = require('./type');
var FieldCollection = require('../field-collection');
var assert = require('assert');
var _ = require('lodash');
var format = require('util').format;

/**
 * Documents have sub-fields stored in .fields
 */
exports.Document = Type.extend({
  props: {
    name: {
      default: 'Document'
    }
  },
  collections: {
    fields: FieldCollection
  },
  /**
   * parse sub-document and add each key/value to this.fields
   * @param {Object} obj  The sub-document to be parsed
   */
  parse: function(obj) {
    // parse sub-document and add to this.fields
    assert(_.isPlainObject(obj), format('value must be object, got `%s`', obj));

    /**
     * this is a nice way to handle the Undefined values. It iterates over the union
     * of object keys and existing field names, automatically inserting undefined
     * for the fields that are not in the current object.
     *
     * Only caveat is that when a field is created for the first time, we need to
     * retrospectively bump up the undefined count. That's taken care of in
     * @see FieldCollection#addToField
     */
    var union = _.union(_.keys(obj), this.fields.pluck('name'));
    _.each(union, function(key) {
      this.fields.addToField(key, obj[key]);
    }.bind(this));

    this.count += 1;
  }
});
