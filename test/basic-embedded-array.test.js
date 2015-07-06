var getSchema = require('../');
var assert = require('assert');
var BSON = require('bson');
var _ = require('lodash');

describe('basic embedded array', function() {
  var following;
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
    },

  ];

  before(function(done) {
    following = getSchema('following', docs, function() {
      following_ids = following.fields.get('following_ids').types.get('Array');
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
    assert.equal(_.sum(following_ids.types.pluck('probability')), 1);
  });

  it('should have 33% String for following_ids', function() {
    assert.equal(following_ids.types.get('String').probability, 1 / 3);
  });

  it('should have 66% ObjectID for following_ids', function() {
    assert.equal(following_ids.types.get('ObjectID').probability, 2 / 3);
  });

  it('should serialize correctly', function() {
    assert.doesNotThrow(function() {
      following.toJSON();
    });
  });
});
