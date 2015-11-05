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
    schema = getSchema('nested.documents', docs, done);
  });

  it('should assemble the path correctly with dot-notation', function() {
    assert.equal(schema.fields.get('foo').fields.get('bar').fields.get('baz').path, 'foo.bar.baz');
  });
});
