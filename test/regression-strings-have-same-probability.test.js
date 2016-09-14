var getSchema = require('../');
var assert = require('assert');
var _ = require('lodash');

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
      getSchema(docs, function(err, res) {
        assert.ifError(err);
        schema = res;
        done();
      });
    });


    it('should not dedupe values but return all 3 of them', function() {
      assert.equal(_.find(_.find(schema.fields, 'name', 'value').types,
        'name', 'String').values.length, 3);
    });
  });
});
