var getSchema = require('../');
var assert = require('assert');
var BSON = require('bson');

/* eslint quote-props: 0, new-cap: 0, camelcase: 0 */
describe('evolving schema', function() {
  // The hardest case and really why this module exists at all: proper
  // handling for polymorphic schemas.  Consider the following scenario:
  //
  // 1. started out with schema in `only basic fields`.
  // 2. then read a blog post about how awesome; embedded documents are.
  // 3. then realized what a pain embedded documents are.
  var apple_push_token;
  var docs = [
    {
      '_id': new BSON.ObjectID('55582407aafa8fbbc57196e2'),
      'name': 'Brett Flowers',
      'email': {
        '_id': 'gohu@pum.io',
        'is_verified': false
      },
      'twitter': {
        'username': '@lekbisova'
      },
      'stats': {
        'friends': 7584
      },
      'push_token': {
        'android': undefined,
        'apple': '4e2e068cd281cfe924ff3174dfe363bd3108a5852ca5197f37c40c1bca6e1a4c'
      },
      'last_address': {
        'latitude': null,
        'longitude': null
      },
      'created_at': new Date()
    },
    {
      '_id': new BSON.ObjectID('55581e0a9bf712d0c2b48d71'),
      'email': 'tupjud@weigehib.gov',
      'is_verified': false,
      'twitter_username': '@zaetisi',
      'name': 'Hunter Maxwell',
      'stats_friends': 2163,
      'apple_push_token': 'd4b4e7f3361cec05fae848575d7e6e1da2f0dccdf8ccc86a8ff2124d8b0542f6',
      'android_push_token': undefined,
      'last_address_latitude': null,
      'last_address_longitude': null,
      'created_at': new Date()
    }
  ];

  before(function(done) {
    getSchema(docs, function(err, users) {
      assert.ifError(err);
      apple_push_token = users.fields.find(v => v.name === 'apple_push_token');
      done();
    });
  });
  it('should have the `apple_push_token` field', function() {
    assert.ok(apple_push_token);
  });
  it('should have seen `apple_push_token` 1 time', function() {
    assert.equal(apple_push_token.count, 1);
  });
  it('should have seen `apple_push_token` in 50% of documents', function() {
    assert.equal(apple_push_token.probability, 0.5);
  });
  it('should have seen `apple_push_token` 1 time as a string', function() {
    assert.equal(apple_push_token.types.find(v => v.name === 'String').count, 1);
  });
  it('should have seen 1 unique string value for `apple_push_token`', function() {
    assert.equal(apple_push_token.types.find(v => v.name === 'String').unique, 1);
  });
});
