var Schema = require('../').Schema;
var assert = require('assert');

describe('values', function() {
  it('should keep a simple collection in sync', function(done) {
    var schema = new Schema();
    schema.fields.on('add', function(field) {
      assert.equal(field.getId(), '_id');
      field.values.on('add', function(value, collection) {
        assert.equal(value.getId(), 1);
        assert.equal(value.value, 1);
        done();
      });
    });
    schema.parse({
      _id: 1
    });
  });
});
