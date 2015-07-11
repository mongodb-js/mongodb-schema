var getSchema = require('../');
var TypeCollection = getSchema.TypeCollection;
var assert = require('assert');
var BSON = require('bson');

/*eslint new-cap: 0, quote-props: 0, no-new: 0*/
describe('using only basic fields', function() {
  var docs = [
    {
      '_id': BSON.ObjectID('55581e0a9bf712d0c2b48d71'),
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

  var users;
  it('should work', function(done) {
    assert.doesNotThrow(function() {
      users = getSchema('users', docs, done);
    });
  });
  it('should detect all fields', function() {
    var field_names = [
      '_id',
      'android_push_token',
      'apple_push_token',
      'created_at',
      'email',
      'is_verified',
      'last_address_latitude',
      'last_address_longitude',
      'name',
      'stats_friends',
      'twitter_username'
    ];
    assert.deepEqual(users.fields.pluck('name'), field_names);
  });

  it('should detect the correct type for each field', function() {
    assert.equal(users.fields.get('_id').type, 'ObjectID');
    assert.equal(users.fields.get('apple_push_token').type, 'String');
    assert.equal(users.fields.get('created_at').type, 'Date');
    assert.equal(users.fields.get('email').type, 'String');
    assert.equal(users.fields.get('is_verified').type, 'Boolean');
    assert.equal(users.fields.get('last_address_latitude').type, 'Null');
    assert.equal(users.fields.get('last_address_longitude').type, 'Null');
    assert.equal(users.fields.get('name').type, 'String');
    assert.equal(users.fields.get('stats_friends').type, 'Number');
    assert.equal(users.fields.get('twitter_username').type, 'String');
  });

  it('should serialize correctly', function() {
    assert.doesNotThrow(function() {
      users.toJSON();
    });
  });
  it('should raise a TypeError for unknown types', function() {
    assert.throws(function() {
      new TypeCollection({
        model: 'Image'
      });
    });
  });
});
