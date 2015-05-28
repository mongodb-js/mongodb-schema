var getSchema = require('../');
var assert = require('assert');

describe('regression', function() {
  describe('strings have same probability', function() {
    var docs = [
    // Add some object literals here
    ];
    var schema;
    before(function(done) {
      schema = getSchema('probability', docs, function(err) {
        if (err) return done(err);
        done();
      });
    });

    // Replace X, Y, and Z in `it`
    it('should have a probability of `X%` for the field `Y` to be Z', function() {
      // Replace X, Y, and Z below and uncomment it
      // assert.equal(schema.fields.get('X').types.get('Y').probability, Z);
    });
  });
});
