import type { MongoDBJSONSchema, StandardJSONSchema } from './types';
import { analyzeDocuments } from './index';
import { toTypescriptTypeDefinition } from './to-typescript';

import assert from 'assert/strict';

import {
  BSONRegExp,
  Binary,
  Code,
  DBRef,
  Decimal128,
  Double,
  Int32,
  Long,
  MaxKey,
  MinKey,
  ObjectId,
  Timestamp,
  UUID,
  BSONSymbol
} from 'bson';

import { inspect } from 'util';

function convertAndCompare(schema: MongoDBJSONSchema, expected: string) {
  const code = toTypescriptTypeDefinition(schema);

  try {
    assert.equal(code, expected);
  } catch (err: any) {
    // While the diff you get when this fails is handy, it is much easier to
    // just copy/paste the actual code to the expected result once you've
    // confirmed it is correct. Also it is nice to be able to see what schema
    // you're working with.

    // eslint-disable-next-line no-console
    console.log(inspect(schema, { depth: null }));

    // eslint-disable-next-line no-console
    console.log(code);

    throw err;
  }
}

describe('toTypescriptTypeDefinition', function() {
  it('converts a MongoDB JSON schema to TypeScript', async function() {
    const docs = [
      {
        _id: new ObjectId('642d766b7300158b1f22e972'),
        double: new Double(1.2), // Double, 1, double
        doubleThatIsAlsoAnInteger: new Double(1), // Double, 1, double
        string: 'Hello, world!', // String, 2, string
        object: { key: 'value' }, // Object, 3, object
        array: [1, 2, 3], // Array, 4, array
        binData: new Binary(Buffer.from([1, 2, 3])), // Binary data, 5, binData
        // Undefined, 6, undefined (deprecated)
        objectId: new ObjectId('642d766c7300158b1f22e975'), // ObjectId, 7, objectId
        boolean: true, // Boolean, 8, boolean
        date: new Date('2023-04-05T13:25:08.445Z'), // Date, 9, date
        null: null, // Null, 10, null
        regex: new BSONRegExp('pattern', 'i'), // Regular Expression, 11, regex
        // DBPointer, 12, dbPointer (deprecated)
        javascript: new Code('function() {}'), // JavaScript, 13, javascript
        symbol: new BSONSymbol('symbol'), // Symbol, 14, symbol (deprecated)
        javascriptWithScope: new Code('function() {}', { foo: 1, bar: 'a' }), // JavaScript code with scope 15 "javascriptWithScope" Deprecated in MongoDB 4.4.
        int: new Int32(12345), // 32-bit integer, 16, "int"
        timestamp: new Timestamp(new Long('7218556297505931265')), // Timestamp, 17, timestamp
        long: new Long('123456789123456789'), // 64-bit integer, 18, long
        decimal: new Decimal128(
          Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
        ), // Decimal128, 19, decimal
        minKey: new MinKey(), // Min key, -1, minKey
        maxKey: new MaxKey(), // Max key, 127, maxKey

        binaries: {
          generic: new Binary(Buffer.from([1, 2, 3]), 0), // 0
          functionData: new Binary(Buffer.from('//8='), 1), // 1
          binaryOld: new Binary(Buffer.from('//8='), 2), // 2
          uuidOld: new Binary(Buffer.from('c//SZESzTGmQ6OfR38A11A=='), 3), // 3
          uuid: new UUID('AAAAAAAA-AAAA-4AAA-AAAA-AAAAAAAAAAAA'), // 4
          md5: new Binary(Buffer.from('c//SZESzTGmQ6OfR38A11A=='), 5), // 5
          encrypted: new Binary(Buffer.from('c//SZESzTGmQ6OfR38A11A=='), 6), // 6
          compressedTimeSeries: new Binary(
            Buffer.from(
              'CQCKW/8XjAEAAIfx//////////H/////////AQAAAAAAAABfAAAAAAAAAAEAAAAAAAAAAgAAAAAAAAAHAAAAAAAAAA4AAAAAAAAAAA==',
              'base64'
            ),
            7
          ), // 7
          custom: new Binary(Buffer.from('//8='), 128) // 128
        },

        dbRef: new DBRef('namespace', new ObjectId('642d76b4b7ebfab15d3c4a78')) // not actually a separate type, just a convention

        // TODO: what about arrays of objects or arrays of arrays or heterogynous types in general
      }
    ];
    const analyzedDocuments = await analyzeDocuments(docs);
    const schema = await analyzedDocuments.getMongoDBJsonSchema();

    convertAndCompare(
      schema,
      `{
  _id?: bson.ObjectId;
  array?: bson.Double | number)[];
  binaries?: {
    binaryOld?: bson.Binary;
    compressedTimeSeries?: bson.Binary;
    custom?: bson.Binary;
    encrypted?: bson.Binary;
    functionData?: bson.Binary;
    generic?: bson.Binary;
    md5?: bson.Binary;
    uuid?: bson.Binary;
    uuidOld?: bson.Binary;
  };
  binData?: bson.Binary;
  boolean?: boolean;
  date?: bson.Date;
  dbRef?: bson.DBPointer;
  decimal?: bson.Decimal128;
  double?: bson.Double | number;
  doubleThatIsAlsoAnInteger?: bson.Double | number;
  int?: bson.Int32 | number;
  javascript?: bson.Code;
  javascriptWithScope?: bson.Code;
  long?: bson.Long | number;
  maxKey?: bson.MaxKey;
  minKey?: bson.MinKey;
  null?: null;
  object?: {
    key?: string;
  };
  objectId?: bson.ObjectId;
  regex?: bson.BSONRegExp;
  string?: string;
  symbol?: bson.BSONSymbol;
  timestamp?: bson.Timestamp;
}`
    );
  });

  it('converts a standard JSON schema to TypeScript', function() {
    // from https://json-schema.org/learn/miscellaneous-examples#complex-object-with-nested-properties
    const schema: StandardJSONSchema = {
      $id: 'https://example.com/complex-object.schema.json',
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      title: 'Complex Object',
      type: 'object',
      properties: {
        name: {
          type: 'string'
        },
        age: {
          type: 'integer',
          minimum: 0
        },
        address: {
          type: 'object',
          properties: {
            street: {
              type: 'string'
            },
            city: {
              type: 'string'
            },
            state: {
              type: 'string'
            },
            postalCode: {
              type: 'string',
              pattern: '\\d{5}'
            }
          },
          required: ['street', 'city', 'state', 'postalCode']
        },
        hobbies: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      },
      required: ['name', 'age']
    };

    convertAndCompare(
      schema,
      `{
  name?: string;
  age?: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  hobbies?: string[];
}`
    );
  });

  it('deals with inconsistent types', async function() {
    const docs = [
      {
        a: 1
      },
      {
        a: 'foo'
      },
      {
        a: true
      },
      {
        a: null
      }
    ];

    const analyzedDocuments = await analyzeDocuments(docs);
    const schema = await analyzedDocuments.getMongoDBJsonSchema();

    convertAndCompare(
      schema,
      `{
  a?: bson.Double | number | string | boolean | null;
}`
    );
  });

  it('deals with nested arrays', async function() {
    const docs = [
      {
        a: [['foo']],
        b: [[{ b: 'foo' }]]
      }
    ];

    const analyzedDocuments = await analyzeDocuments(docs);
    const schema = await analyzedDocuments.getMongoDBJsonSchema();

    convertAndCompare(
      schema,
      `{
  a?: any[];
  b?: any[];
}`
    );
  });

  it('deals with nested objects', async function() {
    const docs = [
      {
        a: {
          foo: { bar: 'baz' }
        },
        b: [
          {
            foo: { bar: 'baz' }
          }
        ]
      }
    ];

    const analyzedDocuments = await analyzeDocuments(docs);
    const schema = await analyzedDocuments.getMongoDBJsonSchema();

    convertAndCompare(
      schema,
      `{
  a?: {
    foo?: {
      bar?: string;
    };
  };
  b?: any[];
}`
    );
  });
});
