var getSchema = require('../');
var assert = require('assert');

/* eslint new-cap: 0, quote-props: 0 */
describe('nested document path', function() {
  var schema;
  var docs = [
    {
      'foo': {
        'bar': {
          'baz': 1
        }
      }
    }
  ];

  before(function(done) {
    getSchema(docs, function(err, res) {
      assert.ifError(err);
      schema = res;
      done();
    });
  });

  it('should assemble the path correctly with dot-notation', function() {
    var foo = schema.fields.find(v => v.name === 'foo');
    var bar = foo.types.find(v => v.name === 'Document').fields.find(v => v.name === 'bar');
    var baz = bar.types.find(v => v.name === 'Document').fields.find(v => v.name === 'baz');
    assert.ok(foo);
    assert.ok(bar);
    assert.ok(baz);
    assert.equal(baz.path, 'foo.bar.baz');
  });
});
