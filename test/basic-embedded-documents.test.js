var getSchema = require('../');
var assert = require('assert');
var BSON = require('bson');

/*eslint new-cap: 0, quote-props: 0*/
describe('basic embedded documents', function() {
  var users;
  var docs = [
    {
      '_id': BSON.ObjectID('55582407aafa8fbbc57196e2'),
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
    }
  ];

  before(function(done) {
    users = getSchema('users', docs, done);
  });

  it('should detect all fields names and nested paths', function() {
    var field_names = [
      '_id',
      'created_at',
      'email',
      'last_address',
      'name',
      'push_token',
      'stats',
      'twitter'
    ];

    var nested_path_names = [
      'push_token.android',
      'push_token.apple'
    ];

    assert.deepEqual(users.fields.pluck('name'), field_names);
    assert.deepEqual(users.fields.get('push_token').fields.pluck('path'), nested_path_names);
  });
  it('should serialize correctly', function() {
    assert.doesNotThrow(function() {
      users.toJSON();
    });
  });
});
