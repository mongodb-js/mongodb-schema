var _ = require('lodash');
var State = require('ampersand-state');
var TypeCollection = require('./type-collection');
var ValueCollection = require('./value-collection');
var debug = require('debug')('mongodb-schema:field');

/**
 * Describes a single field in the schema based on sampled values.
 */
module.exports = State.extend({
  className: 'Field',
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
     * Probability of this field being set.
     */
    // probability: {
    //   type: 'number',
    //   default: 0
    // },
    /**
     * Number of unique values seen.
     */
    unique: {
      type: 'number',
      default: 0
    },
    /**
     * If using shortened keys to save space, it is expected this be the "real"
     * name of the field that could be input by the user.  For example,
     * if `u` is the field's `name`, `username` is the field's title
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
    description: 'string',
  },
  session: {
    parent: 'state'
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
      deps: ['count', 'parent.count'],
      cache: false,
      fn: function () {
        if (!this.parent) return null;
        return this.count / this.parent.count;
      }
    },
    /**
     * The total number of documents we would see if always set.
     * This differs from `#count` as it is the value used to calculate
     * the probability of this field's children.  @see #commit()
     */
    // total: {
    //   deps: ['count', 'probability'],
    //   fn: function() {
    //     if (this.probability === 1) return this.count;

    //     var parentIsArray = false;
    //     if (this.collection && this.collection.parent) {
    //       parentIsArray = this.collection.parent.type === 'Array';
    //     }
    //     if (parentIsArray) {
    //       return _.sum(this.types.pluck('count'));
    //     }
    //     return (this.count / this.probability);
    //   }
    // },
    /**
     * Does this field contain any duplicate values?
     * @returns {Boolean}
     */
    has_duplicates: {
      deps: ['unique', 'count'],
      fn: function() {
        return this.unique < this.count;
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
  collections: {
    /**
     * Types seen for this field.
     */
    types: TypeCollection,
    /**
     * A sample of values seen for this field.
     */
    values: ValueCollection
  },
  /**
   * @constructs Field
   */
  initialize: function() {
    this.listenTo(this.types, 'add', this.onTypeAdded);
    this.listenTo(this.types, 'remove', this.onTypeRemoved);
    this.listenTo(this.types, 'reset refresh', this.onTypeReset);
  },
  /**
   * When new types are added, trigger a change event to recalculate `this.type`
   * and add listeners so any operations on `type.values` are reflected on
   * `this.values`.
   *
   * @param {Type} type that's being added.
   * @param {TypeCollection} collection the type was added to.
   * @param {Object} options
   */
  onTypeAdded: function(type) {
    /**
     * Currently have to manually trigger events on collections so
     * derived properties are recalculated at the right time.
     * In this case, triggering `change:types.length` will cause
     * the `type` property to be recalculated correctly.
     */
    this.trigger('change:types.length');
    if (type.values) {
      this.listenTo(type.values, 'add', this.onValueAdded);
      this.listenTo(type.values, 'remove', this.onValueRemoved);
      this.listenTo(type.values, 'reset', this.onValueReset);
    }
  },
  /**
   * @see Schema#onTypeAdded
   *
   * @param {Type} type being removed.
   * @param {TypeCollection} collection it was removed from.
   * @param {Object} options
   */
  onTypeRemoved: function(type) {
    this.trigger('change:types.length');
    if (type.values) {
      this.stopListening(type.values, 'add', this.onValueAdded);
      this.stopListening(type.values, 'remove', this.onValueRemoved);
      this.stopListening(type.values, 'reset', this.onValueReset);
    }
  },
  onTypeReset: function() {
    this.trigger('change:types.length');
  },
  /**
   * @param {ValueCollection} collection the value was added to.
   * @param {Value} value being added.
   * @param {Object} options
   */
  onValueAdded: function(value) {
    this.values.add(value);
  },
  /**
   * @param {ValueCollection} collection the value was removed from.
   * @param {Value} value being removed.
   * @param {Object} options
   */
  onValueRemoved: function(value) {
    this.values.remove(value);
  },
  onValueReset: function() {
    this.values.reset();
  },
  /**
   * We've finished parsing a new document! Finalize all of the probabilities
   * and make sure all of our child collections are nicely sorted.
   * If we have any subfields, call `commit()` on each of those as well.
   */
  // commit: function() {
  //   var newprob;
  //   newprob = this.count / this.parent.count;
  //   if (newprob !== this.probability) {
  //     this.probability = newprob;
  //   }
  //   var undef = this.types.get('Undefined');
  //   if ((this.total - this.count) <= 0) {
  //     if(undef){
  //       debug('removing extraneous Undefined for `%s`', this.getId());
  //       this.types.remove({
  //         name: 'Undefined'
  //       });
  //     }
  //     // No undefined types to manage
  //   } else {
  //     if (!undef) {
  //       debug('adding Undefined for `%s`', this.getId());
  //       undef = this.types.add({
  //         name: 'Undefined',
  //         unique: 1
  //       });
  //     }
  //     undef.count = (this.total - this.count);
  //     undef.probability = (undef.count - this.count);
  //   }
  //   this.types.map(function(type) {
  //     type.probability = type.count / this.total;
  //     type.unique = _.unique(type.values.pluck('value')).length;
  //   }.bind(this));
  //   this.unique = _.sum(this.types.pluck('unique'));
  //   this.types.sort();

  //   if (this.fields.length > 0) {
  //     this.fields.map(function(field) {
  //       field.commit();
  //     });
  //   }
  // },
  serialize: function() {
    var res = this.getAttributes({
      props: true,
      derived: true
    }, true);
    if (this.fields.length > 0) {
      res.fields = this.fields.serialize();
    } else {
      res.values = this.values.serialize();
      res.types = this.types.serialize();
    }
    return res;
  },
});


