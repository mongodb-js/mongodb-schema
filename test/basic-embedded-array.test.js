var getSchema = require('../');
var assert = require('assert');
var BSON = require('bson');

describe('basic embedded array', function() {
  var following;
  var docs = [
    {
      '_id': BSON.ObjectID('55581e0a9bf712d0c2b48d71'),
      'following_ids': [BSON.ObjectID('55582407aafa8fbbc57196e2')]
    },
    {
      '_id': BSON.ObjectID('55582407aafa8fbbc57196e2'),
      'following_ids': [BSON.ObjectID('55581e0a9bf712d0c2b48d71')]
    },

  ];

  before(function(done) {
    following = getSchema('following', docs, done);
  });

  it('should serialize correctly', function() {
    assert.doesNotThrow(function() {
      following.toJSON();
    });
  });
  // @todo: write more tests when not so tired...
});
