var getSchema = require('../');
var Schema = require('../lib/schema');
var assert = require('assert');

var debug = require('debug')('mongodb-schema:test:revive');

var clone = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

/* eslint quote-props: 0 */
describe('Reviving a Schema', function() {
  var docs = [
    {
      x: [1]
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
      x: [null, false, 'test']
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
  it('should return identical results with fast parsing algorithm', function(done) {
    var oldSerialized = schema.serialize();
    var newSchema = getSchema('mixed.mess', docs, function() {
      var newSerialized = newSchema.serialize();
      debug('old: %j', oldSerialized);
      debug('new: %j', newSerialized);
      assert.deepEqual(clone(oldSerialized), clone(newSerialized));
      done();
    }, true);
  });
  it('should serialize and revive on construction', function() {
    var oldSerialized = schema.serialize();
    var copy = JSON.parse(JSON.stringify(oldSerialized));
    var newSchema = new Schema(copy, {
      parse: true
    });
    var newSerialized = newSchema.serialize();
    assert.equal(JSON.stringify(oldSerialized), JSON.stringify(newSerialized));
  });
  it('should serialize and revive through `model.set()`', function() {
    var oldSerialized = schema.serialize();
    var copy = JSON.parse(JSON.stringify(oldSerialized));
    var newSchema = new Schema();
    newSchema.set(copy, {
      parse: true
    });
    var newSerialized = newSchema.serialize();
    assert.equal(JSON.stringify(oldSerialized), JSON.stringify(newSerialized));
  });
});
