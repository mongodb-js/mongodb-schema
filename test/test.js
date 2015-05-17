var schema = require('../');
var assert = require('assert');
var EJSON = require('mongodb-extended-json');
var _ = require('lodash');

var FIXTURES = {
  basic: {
    users: EJSON.deflate(require('./fixture-basic-users.json')),
    following: EJSON.deflate(require('./fixture-basic-following.json'))
  },
  embedded_documents: {
    users: EJSON.deflate(require('./fixture-embedded-documents-users.json'))
  }
};

describe('mongodb-schema', function() {
  describe('using only basic fields', function() {
    var users;
    it('should work', function() {
      assert.doesNotThrow(function() {
        users = schema('users', FIXTURES.basic.users);
      });
    });
    it('should detect all fields', function() {
      assert.equal(users.fields.length, 11);

      var field_ids = [
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
      assert.deepEqual(users.fields.pluck('_id'), field_ids);
    });

    it('should detect the correct type for each field', function() {
      assert.equal(users.fields.get('_id').type, 'ObjectID');
      assert.equal(users.fields.get('android_push_token').type, 'Undefined');
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
  });

  describe('using basic fields and embedded documents', function() {
    var users;
    it('should work', function() {
      assert.doesNotThrow(function() {
        users = schema('users', FIXTURES.embedded_documents.users);
      });
    });

    it('should detect all fields', function() {
      assert.equal(users.fields.length, 8);

      var field_ids = [
        '_id',
        'created_at',
        'email',
        'last_address',
        'name',
        'push_token',
        'stats',
        'twitter'
      ];
      assert.deepEqual(users.fields.pluck('_id'), field_ids);
    });
  });

  describe('embedded array of basic properties', function() {
    var following;
    it('should work', function() {
      assert.doesNotThrow(function() {
        following = schema('following', FIXTURES.basic.following);
      });
    });
    // @todo: write more tests when not so tired...
  });

  describe('evolving schema', function() {
    // The hardest case and really why this module exists at all: proper
    // handling for polymorphic schemas.  Consider the following scenario:
    //
    // 1. started out with schema in `only basic fields`.
    // 2. then read a blog post about how awesome embedded documents are.
    // 3. then realized what a pain embedded documents are.
    var users;
    it('should work', function() {
      assert.doesNotThrow(function() {
        users = schema('users', _.union(FIXTURES.basic.users, FIXTURES.embedded_documents.users));
        //console.log('users schema', JSON.stringify(users, null, 2));
      });
    });
    // @todo: figure out where we're not hitting a counter when not so tired...
    it.skip('should have the correct probabilities for a field that was moved', function() {
      var apple_push_token = users.fields.get('apple_push_token');
      assert.equal(apple_push_token.count, 1);
      assert.equal(apple_push_token.has_children, false);
      assert.equal(apple_push_token.type, 'String');
      assert.equal(apple_push_token.types.get('String').count, 1);
      assert.equal(apple_push_token.types.get('String').unique, 1);
      assert.equal(apple_push_token.types.get('String').probability, 0.5,
        '`apple_push_token` only appeared in 50% of documents but thinks it ' +
        'has a probability of ' +
        (apple_push_token.types.get('String').probability * 100) + '%');
    });
  });
});
