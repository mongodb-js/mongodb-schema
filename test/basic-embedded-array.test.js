var getSchema = require('../');
var assert = require('assert');
var BSON = require('bson');

/* eslint new-cap: 0, quote-props: 0, camelcase: 0 */
describe('basic embedded array', function() {
  var following_ids;
  var docs = [
    {
      '_id': BSON.ObjectID('55581e0a9bf712d0c2b48d71'),
      'following_ids': [BSON.ObjectID('55582407aafa8fbbc57196e2')]
    },
    {
      '_id': BSON.ObjectID('55582407aafa8fbbc57196e2'),
      'following_ids': [
        BSON.ObjectID('55581e0a9bf712d0c2b48d71'),
        '55581e0a9bf712d0c2b48d71'
      ]
    }
  ];

  before(function(done) {
    getSchema(docs, function(err, res) {
      assert.ifError(err);
      var types = res.fields.find(v => v.name === 'following_ids').types;
      following_ids = types.find(v => v.name === 'Array');
      done();
    });
  });

  it('should have 2 lengths for following_ids', function() {
    assert.deepEqual(following_ids.lengths, [1, 2]);
  });

  it('should have an average length of 1.5 for following_ids', function() {
    assert.equal(following_ids.average_length, 1.5);
  });

  it('should have a sum of probability for following_ids of 1', function() {
    var expectedSum = following_ids.types
      .map(v => v.probability)
      .reduce((p, c) => p + c || 0, 0);
    assert.equal(expectedSum, 1);
  });

  it('should have 33% String for following_ids', function() {
    assert.equal(following_ids.types.find( v => v.name === 'String').probability, 1 / 3);
  });

  it('should have 66% ObjectID for following_ids', function() {
    assert.equal(following_ids.types.find(v => v.name === 'ObjectID').probability, 2 / 3);
  });
});
