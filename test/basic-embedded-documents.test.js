var getSchema = require('../');
var assert = require('assert');
var BSON = require('bson');
var _ = require('lodash');

/* eslint new-cap: 0, quote-props: 0, camelcase: 0 */
describe('basic embedded documents', function() {
  var docs = [
    {
      _id: new BSON.ObjectID('55582407aafa8fbbc57196e2'),
      name: 'Brett Flowers',
      email: {
        _id: 'gohu@pum.io',
        is_verified: false
      },
      twitter: {
        username: '@lekbisova'
      },
      stats: {
        friends: 7584
      },
      push_token: {
        android: undefined,
        apple:
          '4e2e068cd281cfe924ff3174dfe363bd3108a5852ca5197f37c40c1bca6e1a4c'
      },
      last_address: {
        latitude: null,
        longitude: null
      },
      created_at: new Date()
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

    var nested_path_names = ['push_token.android', 'push_token.apple'];

    assert.deepEqual(_.map(schema.fields, 'name').sort(), field_names.sort());
    var push_tokens = _.find(
      _.find(schema.fields, 'name', 'push_token').types,
      'name',
      'Document'
    ).fields;
    assert.deepEqual(
      _.map(push_tokens, 'path').sort(),
      nested_path_names.sort()
    );
  });
});
