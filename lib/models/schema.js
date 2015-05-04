var AmpersandModel = require('ampersand-model');

var FieldCollection = require('./field-collection');
var debug = require('debug')('mongodb-schema');

module.exports = AmpersandModel.extend({
  children: {
    fields: FieldCollection
  },
  analyze: function(sampledField, done) {
    if (this.fields.get(sampledField._id)) {
      debug('already have the field %j', sampledField);
      return done();
    }
  }
});
