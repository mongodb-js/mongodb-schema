var getSchema = require('../');
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
        users = getSchema('users', FIXTURES.basic.users);
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
        users = getSchema('users', FIXTURES.embedded_documents.users);
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
        following = getSchema('following', FIXTURES.basic.following);
      });
    });
    // @todo: write more tests when not so tired...
  });

  describe('evolving schema', function() {
    // The hardest case and really why this module exists at all: proper
    // handling for polymorphic schemas.  Consider the followi;ng scenario:
    //
    // 1. started out with schema in `only basic fields`.
    // 2. then read a blog post about how awesome; embedded documents are.
    // 3. then realized what a pain embedded documents are.
    var users;
    it('should work', function() {
      assert.doesNotThrow(function() {
        users = getSchema('users', _.union(FIXTURES.basic.users, FIXTURES.embedded_documents.users));
      });
    });
    it('should have the correct probabilities for a field that was moved', function() {
      var apple_push_token = users.fields.get('apple_push_token');
      assert.equal(apple_push_token.count, 1);
      assert.equal(apple_push_token.type, 'String');
      assert.equal(apple_push_token.types.get('String').count, 1);
      assert.equal(apple_push_token.types.get('String').unique, 1);
      assert.equal(apple_push_token.probability, 0.5,
        '`apple_push_token` only appeared in 50% of documents but thinks it ' +
        'has a probability of ' +
        (apple_push_token.probability * 100) + '%');
    });
  });

  describe('simple probability', function() {
    var docs = [
      {
        _id: 1,
        registered: true
      },
      {
        _id: 2
      }
    ];

    var schema;
    it('should load the schema', function() {
      assert.doesNotThrow(function() {
        schema = getSchema('probability', docs);
      });
    });
    it('should have a probability of 50% for `registered` to be a boolean', function() {
      assert.equal(schema.fields.get('registered').types.get('Boolean').probability, 1 / 2);
    });
    it('should have a probability of 50% for `registered` to be undefined', function() {
      assert.equal(schema.fields.get('registered').types.get('Undefined').probability, 1 / 2);
    });
  });

  describe('mixed type probability', function() {
    var docs = [
      {
        _id: 1,
        registered: 1
      },
      {
        _id: 2,
        registered: '1'
      },
      {
        _id: 3,
        registered: true
      },
      {
        _id: 4
      }
    ];

    var schema;
    it('should load the schema', function(done) {
      assert.doesNotThrow(function() {
        schema = getSchema('probability', docs, done);
      });
    });
    it('should have 4 types for `registered`', function() {
      assert.equal(schema.fields.get('registered').types.length, 4);
    });
    it('should have a probability of 25% for `registered` to be a boolean', function() {
      assert.equal(schema.fields.get('registered').types.get('Boolean').probability, (1 / 4));
    });
    it('should have a probability of 25% for `registered` to be a number', function() {
      assert.equal(schema.fields.get('registered').types.get('Number').probability, (1 / 4));
    });
    it('should have a probability of 25% for `registered` to be a string', function() {
      assert.equal(schema.fields.get('registered').types.get('String').probability, (1 / 4));
    });
    it('should have a probability of 25% for `registered` to be undefined', function() {
      assert.equal(schema.fields.get('registered').types.get('Undefined').probability, (1 / 4));
    });
  });
  describe('unique', function() {
    var docs = [
      {
        _id: 1,
        registered: true
      },
      {
        _id: 2,
        registered: true
      }
    ];

    var schema;
    it('should load the schema', function() {
      assert.doesNotThrow(function() {
        schema = getSchema('probability', docs);
      });
    });

    it('should have count of 2 for `_id`', function() {
      assert.equal(schema.fields.get('_id').count, 2);
    });

    it('should have unique of 2 for `_id`', function() {
      assert.equal(schema.fields.get('_id').unique, 2);
      assert.equal(schema.fields.get('_id').types.get('Number').unique, 2);
    });

    it('should not have duplicates for `_id`', function() {
      assert.equal(schema.fields.get('_id').has_duplicates, false);
    });

    it('should have count of 2 for `registered`', function() {
      assert.equal(schema.fields.get('registered').count, 2);
    });

    it('should have unique of 1 for `registered`', function() {
      assert.equal(schema.fields.get('registered').unique, 1);
    });

    it('should have duplicates for `registered`', function() {
      assert.equal(schema.fields.get('registered').has_duplicates, true);
    });
  });
});
