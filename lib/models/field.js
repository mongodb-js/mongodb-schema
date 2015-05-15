var AmpersandState = require('ampersand-state');
var TypeCollection = require('./type-collection');
var ValueCollection = require('./value-collection');
var debug = require('debug')('mongodb-schema-field');

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
    this.types.on('all', function(name) {
      debug('got a collection event on types', arguments);
    });

    var field = this;
    this.types.on('add', function(type) {
      if (!type) return console.log('WTF is type?', type);

      if (!type.values) return;

      type.values.on('add', function(model) {
        field.count += 1;
        this.parent.values.add(model);
      }.bind(this));
    });
  }
});
