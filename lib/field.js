var State = require('ampersand-state');
var TypeCollection = require('./type-collection');
var _ = require('lodash');

/**
 * Describes a single field in the schema based on sampled values.
 */
module.exports = State.extend({
  modelType: 'Field',
  idAttribute: 'name',
  props: {
    /**
     * The key in the `parent`.
     */
    name: {
      type: 'string',
      required: true
    },
    /**
     * Number of times this field has been seen in a sample of documents.
     */
    count: {
      type: 'number',
      default: 0
    },
    /**
     * If using shortened keys to save space, it is expected this be the "real"
     * name of the field that could be input by the user.  For example,
     * if `u` is the field's `name`, `username` is the field's `title`
     * and is much friendlier for humans.
     */
    title: {
      type: 'string',
      default: function() {
        return this.name;
      }
    },
    /**
     * Place holder for future annotation of the default value for this field.
     * @see http://spacetelescope.github.io/understanding-json-schema/reference/generic.html#metadata
     */
    default: 'any',
    /**
     * User input annotation about what this field does.
     *
     * @see http://spacetelescope.github.io/understanding-json-schema/reference/generic.html#metadata
     */
    description: 'string'
  },
  session: {
    /**
     * Number of counts of all children types, including Undefined.
     */
    total_count: {
      type: 'number',
      default: 0
    }
  },
  derived: {
    /**
     * Type of the values. String for single type, array of strings for multiple types.
     *
     * @see http://spacetelescope.github.io/understanding-json-schema/reference/type.html
     */
    type: {
      deps: ['types.length'],
      fn: function() {
        if (this.types.length === 0) {
          return undefined;
        }
        if (this.types.length === 1) {
          return this.types.at(0).name;
        }
        return this.types.pluck('name');
      }
    },
    probability: {
      cache: false,
      fn: function() {
        if (!this.parent) return null;
        return this.count / this.parent.count;
      }
    },
    /**
     * How many unique values. Not using cached property here
     * because it depends on Type#unique which is also not
     * cached to avoid excessive recalculations during parsing.
     * @see Type#unique
     * @returns {Number}
     */
    unique: {
      cache: false,
      fn: function() {
        return _.sum(this.types.pluck('unique'));
      }
    },
    /**
     * Does this field contain any duplicate values?
     * Not using cached property here because it depends on
     * Type#unique which is also not cached to avoid excessive
     * recalculations during parsing.
     * @see Type#unique
     * @returns {Boolean}
     */
    has_duplicates: {
      cache: false,
      fn: function() {
        return this.unique < this.count;
      }
    },
    /**
     * Convenience alias to access sub-fields. Returns
     * undefined if this Field does not have a 'Document' type.
     * @returns {FieldCollection}
     */
    fields: {
      deps: ['types.length'],
      fn: function() {
        var objType = this.types.get('Document');
        return objType ? objType.fields : undefined;
      }
    },
    arrayFields: {
      deps: ['types.length'],
      fn: function() {
        var arrType = this.types.get('Array');
        return arrType ? arrType.fields : undefined;
      }
    }
  },
  collections: {
    /**
     * Types seen for this field.
     */
    types: TypeCollection
  },
  serialize: function() {
    var res = this.getAttributes({
      props: true,
      derived: true
    }, true);
    res.types = this.types.serialize();
    if (this.fields) {
      res.fields = this.fields.serialize();
    }
    return res;
  }
});
