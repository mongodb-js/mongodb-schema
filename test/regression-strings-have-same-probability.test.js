var getSchema = require('../');
var assert = require('assert');

describe('regression', function() {
  describe('strings have same probability', function() {
    var docs = [
      {
        _id: 1,
        value: 'DUPE'
      },
      {
        _id: 2,
        value: 'DUPE'
      },
      {
        _id: 3,
        value: 'DUPE'
      }
    ];

    var schema;
    before(function(done) {
      schema = getSchema('probability', docs, function(err) {
        if (err) return done(err);
        done();
      });
    });


    it('should not dedupe values but return all 3 of them', function() {
      assert.equal(schema.fields.get('value').types.get('String').probability, 1);
    });
  });
});
