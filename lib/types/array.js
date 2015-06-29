var Type = require('./type');
var _ = require('lodash');
var format = require('util').format;
var TypeCollection = require('../type-collection');
var assert = require('assert');

/**
 * Arrays have additional .lengths and .average_length properties
 * and group their values in a nested .types collection
 */
module.exports.Array = Type.extend({
  props: {
    name: {
      default: 'Array'
    },
    lengths: {
      type: 'array',
      default: function() {
        return [];
      }
    }
  },
  derived: {
    total_count: {
      cache: false,
      fn: function() {
        return _.sum(this.lengths);
      }
    },
    average_length: {
      deps: ['count'],
      fn: function() {
        return this.total_count / this.count;
      }
    },
    /**
     * Convenience alias to access sub-fields. Returns
     * null if this Field does not have a 'Document' type.
     * @returns {FieldCollection}
     */
    fields: {
      deps: ['types.length'],
      fn: function() {
        var objType = this.types.get('Document');
        return objType ? objType.fields : null;
      }
    }
  },
  parse: function(arr) {
    assert(_.isArray(arr), format('value must be array, got `%s`', arr));

    _.each(arr, function (val) {
      this.types.addToType(val);
    }.bind(this));

    this.lengths.push(arr.length);
    this.count += 1;
  },
  collections: {
    types: TypeCollection
  }
});
