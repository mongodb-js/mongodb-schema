var AmpersandState = require('ampersand-state');
var TypeCollection = require('./type-collection');
var ValueCollection = require('./value-collection');

module.exports = AmpersandState.extend({
  idAttribute: '_id',
  props: {
    _id: {
      type: 'string',
      required: true
    },
    displayName: {
      type: 'string',
      default: function() {
        return this._id;
      }
    },
    description: {
      type: 'string'
    },
    count: {
      type: 'number',
      default: 0
    },
  },
  collections: {
    types: TypeCollection,
    values: ValueCollection
  },
  initialize: function() {
    var field = this;
    this.types.on('add', function(type) {
      type.values.on('add', function(model) {
        field.count += 1;
        type.count += 1;
        this.parent.values.add(model);
      }.bind(this));
    });
  }
});
