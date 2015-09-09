var getSchema = require('../');
var assert = require('assert');
var BSON = require('bson');
var EJSON = require('mongodb-extended-json');

/*eslint new-cap: 0, quote-props: 0*/
describe('objectid docs', function() {
  var schema;
  var docs = [
    {
      '_id': BSON.ObjectID('55e6484748f15136d28b6e76')
    }
  ];

  before(function(done) {
    schema = getSchema('single objectid', docs, function() {
      done();
    });
  });
  it('should be serializable by JSON and EJSON', function() {
    // console.log(JSON.stringify(schema, null, '  '));
    assert.ok(JSON.stringify(schema));  // passes
    assert.ok(EJSON.stringify(schema)); // fails
  });
});
