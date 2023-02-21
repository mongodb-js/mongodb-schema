import assert from 'assert';
import BSON from 'bson';

import getSchema from '../src';
import type { Schema, DocumentSchemaType, SchemaField } from '../src/stream';

describe('basic embedded documents', function() {
  const docs = [
    {
      _id: new BSON.ObjectId('55582407aafa8fbbc57196e2'),
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
        apple: '4e2e068cd281cfe924ff3174dfe363bd3108a5852ca5197f37c40c1bca6e1a4c'
      },
      last_address: {
        latitude: null,
        longitude: null
      },
      created_at: new Date()
    }
  ];

  let schema: Schema;
  before(async function() {
    schema = await getSchema(docs);
  });

  it('should detect all fields names and nested paths', function() {
    const fieldNames = [
      '_id',
      'created_at',
      'email',
      'last_address',
      'name',
      'push_token',
      'stats',
      'twitter'
    ];

    const nestedFieldPaths = [
      'push_token.android',
      'push_token.apple'
    ];

    assert.deepEqual(schema.fields.map(v => v.name).sort(), fieldNames.sort());

    const types = schema.fields.find(v => v.name === 'push_token')?.types;
    const pushTokens = (types?.find(v => v.name === 'Document') as DocumentSchemaType)?.fields;
    assert.deepEqual(pushTokens?.map((v: SchemaField) => v.path).sort(), nestedFieldPaths.sort());
  });
});
