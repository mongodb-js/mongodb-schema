var Schema = require('../').Schema;
var assert = require('assert');

describe('values', function() {
  it('should keep a simple collection in sync', function(done) {
    var schema = new Schema();
    schema.fields.on('add', function(field) {
      assert.equal(field.getId(), '_id');
      field.types.on('add', function(type) {
        assert.equal(type.name, 'Number');
        type.values.on('add', function(value) {
          assert.equal(value.value, 1);
          done();
        });
      });
    });
    schema.analyze({
      _id: 1
    });
  });
});
