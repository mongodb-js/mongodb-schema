var getSchema = require('../');
var assert = require('assert');
var BSON = require('bson');
var _ = require('lodash');

/* eslint new-cap: 0, quote-props: 0, no-new: 0, camelcase: 0 */
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
      'created_at': new Date(),
      'length': 29
    }
  ];

  var users;
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
      'length',
      'name',
      'stats_friends',
      'twitter_username'
    ];
    assert.deepEqual(_.pluck(users.fields, 'name').sort(), field_names.sort());
  });

  before(function(done) {
    getSchema(docs, function(err, res) {
      assert.ifError(err);
      users = res;
      done();
    });
  });

  it('should detect the correct type for each field', function() {
    assert.equal(_.find(users.fields, 'name', '_id').type, 'ObjectID');
    assert.equal(_.find(users.fields, 'name', 'apple_push_token').type, 'String');
    assert.equal(_.find(users.fields, 'name', 'created_at').type, 'Date');
    assert.equal(_.find(users.fields, 'name', 'email').type, 'String');
    assert.equal(_.find(users.fields, 'name', 'is_verified').type, 'Boolean');
    assert.equal(_.find(users.fields, 'name', 'length').type, 'Number');
    assert.equal(_.find(users.fields, 'name', 'last_address_latitude').type, 'Null');
    assert.equal(_.find(users.fields, 'name', 'last_address_longitude').type, 'Null');
    assert.equal(_.find(users.fields, 'name', 'name').type, 'String');
    assert.equal(_.find(users.fields, 'name', 'stats_friends').type, 'Number');
    assert.equal(_.find(users.fields, 'name', 'twitter_username').type, 'String');
  });
});
