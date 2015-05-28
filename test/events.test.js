var Schema = require('../').Schema;
var assert = require('assert');

describe('events', function() {
  it('should fire a change:type event', function(done) {
    var schema = new Schema();
    schema.fields.on('add', function(field) {
      assert.equal(field.getId(), '_id');
      field.on('change:type', function(field, newType) {
        assert.equal(newType, 'Number');
        done();
      });
    });
    schema.parse({
      _id: 1
    });
  });
});
