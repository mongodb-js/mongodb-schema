var getSchema = require('../');
var Schema = require('../lib/schema');
var assert = require('assert');

// var debug = require('debug')('mongodb-schema:test:revive');

/* eslint quote-props: 0 */
describe('Reviving a Schema', function() {
  var docs = [
    {
      x: [1, 2, 3]
    },
    {
      x: 'foo'
    },
    {
      x: {
        b: 1
      }
    },
    {
      x: ['bar', null, false]
    },
    {
      x: [{
        c: 1,
        d: 1
      }, {
        c: 2
      }]
    },
    {
      e: 1
    }
  ];
  var schema;
  before(function(done) {
    schema = getSchema('mixed.mess', docs, done);
  });
  it('should serialize and revive', function() {
    var oldSerialized = schema.serialize();
    var copy = JSON.parse(JSON.stringify(oldSerialized));
    var newSchema = new Schema(copy, {
      parse: true
    });
    var newSerialized = newSchema.serialize();
    assert.equal(JSON.stringify(oldSerialized), JSON.stringify(newSerialized));
  });
});
