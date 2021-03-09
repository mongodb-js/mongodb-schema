var getSchema = require('../');
var assert = require('assert');
var BSON = require('bson');

/* eslint new-cap: 0, quote-props: 0, no-new: 0, camelcase: 0 */
describe('using only basic fields', function() {
  var docs = [
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
      'created_at': new Date(),
      'length': 29,
      'name[]': 'Annabeth Frankie'
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
      'twitter_username',
      'name[]'
    ];
    assert.deepEqual(users.fields.map(v => v.name).sort(), field_names.sort());
  });

  before(function(done) {
    getSchema(docs, function(err, res) {
      assert.ifError(err);
      users = res;
      done();
    });
  });

  it('should detect the correct type for each field', function() {
    assert.equal(users.fields.find(v => v.name === '_id').type, 'ObjectID');
    assert.equal(users.fields.find(v => v.name === 'apple_push_token').type, 'String');
    assert.equal(users.fields.find(v => v.name === 'created_at').type, 'Date');
    assert.equal(users.fields.find(v => v.name === 'email').type, 'String');
    assert.equal(users.fields.find(v => v.name === 'is_verified').type, 'Boolean');
    assert.equal(users.fields.find(v => v.name === 'length').type, 'Number');
    assert.equal(users.fields.find(v => v.name === 'last_address_latitude').type, 'Null');
    assert.equal(users.fields.find(v => v.name === 'last_address_longitude').type, 'Null');
    assert.equal(users.fields.find(v => v.name === 'name').type, 'String');
    assert.equal(users.fields.find(v => v.name === 'stats_friends').type, 'Number');
    assert.equal(users.fields.find(v => v.name === 'twitter_username').type, 'String');
  });
});
