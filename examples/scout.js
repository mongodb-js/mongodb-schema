var scout = require('scout-client')();
var schema = require('mongodb-schema');
var _ = require('lodash');

var Schema = schema.extend({
  fetch: function(options) {
    options = _.defaults(options, {
      size: 5,
      query: {},
      fields: null
    });
    scout.sample(this.ns, options).pipe(this.stream());
  }
});

var FieldView = AmpersandView.extend({
  bindings: {
    'model.displayName': {
      hook: 'name'
    }
  },
  template: require('./field.jade')
});

var FieldListView = AmpersandView.extend({
  template: require('./field-list.jade'),
  render: function() {
    this.renderWithTemplate({});
    this.renderCollectionView(this.collection, FieldView, this.queryByHook('fields'));
  }
});

var CollectionView = AmpersandView.extend({
  model: Schema,
  initialize: function(opts) {
    this.model.ns = opts.ns;
    this.model.fetch();
  },
  template: require('./collection.jade'),
  subviews: {
    fields: {
      hook: 'fields-container',
      prepareView: function(el) {
        return new FieldListView({
          el: el,
          parent: this,
          collection: this.model.fields
        });
      }
    }
  }
});
