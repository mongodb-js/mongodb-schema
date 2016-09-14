var getSchema = require('../');
var assert = require('assert');
var _ = require('lodash');

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
    var foo = _.find(schema.fields, 'name', 'foo');
    var bar = _.find(_.find(foo.types, 'name', 'Document').fields, 'name', 'bar');
    var baz = _.find(_.find(bar.types, 'name', 'Document').fields, 'name', 'baz');
    assert.ok(foo);
    assert.ok(bar);
    assert.ok(baz);
    assert.equal(baz.path, 'foo.bar.baz');
  });
});
