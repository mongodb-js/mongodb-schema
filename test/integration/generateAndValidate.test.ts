import Ajv2020 from 'ajv/dist/2020';
import assert from 'assert';
import {
  Double,
  Int32,
  ObjectId,
  EJSON
} from 'bson';
import { MongoClient, type Db } from 'mongodb';
import { mochaTestServer } from '@mongodb-js/compass-test-server';

import { allBSONTypesWithEdgeCasesDoc } from '../all-bson-types-fixture';
import { analyzeDocuments } from '../../src';

const bsonDocuments = [{
  _id: new ObjectId('67863e82fb817085a6b0ebad'),
  title: 'My book',
  year: new Int32(1983),
  genres: [
    'crimi',
    'comedy',
    {
      short: 'scifi',
      long: 'science fiction'
    }
  ],
  number: Double.fromString('Infinity')
},
{
  _id: new ObjectId('67863eacfb817085a6b0ebae'),
  title: 'Other book',
  year: new Int32('1999'),
  author: {
    name: 'Peter Sonder',
    rating: new Double(1.3)
  }
}];

describe('Documents -> Generate schema -> Validate Documents against the schema', function() {
  it('Standard JSON Schema with Relaxed EJSON', async function() {
    const ajv = new Ajv2020();
    // First we get the JSON schema from BSON
    const analyzedDocuments = await analyzeDocuments(bsonDocuments);
    const schema = await analyzedDocuments.getStandardJsonSchema();
    const validate = ajv.compile(schema);
    for (const doc of bsonDocuments) {
      // Then we get EJSON
      const relaxedEJSONDoc = EJSON.serialize(doc, { relaxed: true });
      // And validate it agains the JSON Schema
      const valid = validate(relaxedEJSONDoc);
      if (validate.errors) console.error('Validation failed', validate.errors);
      assert.strictEqual(valid, true);
    }
  });
});

describe('With a MongoDB Cluster', function() {
  let client: MongoClient;
  let db: Db;
  const cluster = mochaTestServer();

  before(async function() {
    // Connect to the mongodb instance.
    const connectionString = cluster().connectionString;
    client = new MongoClient(connectionString);
    await client.connect();
    db = client.db('test');
  });

  after(async function() {
    await client?.close();
  });

  describe('Documents -> Generate basic schema -> Use schema in validation rule in MongoDB -> Validate documents against the schema', function() {
    before(async function() {
      // Create the schema validation rule.
      const analyzedDocuments = await analyzeDocuments(bsonDocuments);
      const schema = await analyzedDocuments.getMongoDBJsonSchema();
      const validationRule = {
        $jsonSchema: schema
      };

      // Create a collection with the schema validation.
      await db.createCollection('books', {
        validator: validationRule
      });
    });

    it('allows inserting valid documents', async function() {
      await db.collection('books').insertMany(bsonDocuments);
    });

    it('prevents inserting invalid documents', async function() {
      const invalidDocs = [{
        _id: new ObjectId('67863e82fb817085a6b0ebba'),
        title: 'Pineapple 1',
        year: new Int32(1983),
        genres: [
          'crimi',
          'comedy',
          {
            short: 'scifi',
            long: 'science fiction'
          }
        ],
        number: 'an invalid string'
      }, {
        _id: new ObjectId('67863eacfb817085a6b0ebbb'),
        title: 'Pineapple 2',
        year: 'year a string'
      }, {
        _id: new ObjectId('67863eacfb817085a6b0ebbc'),
        title: 123,
        year: new Int32('1999')
      }, {
        _id: new ObjectId('67863eacfb817085a6b0ebbc'),
        title: 'No year'
      }];

      for (const doc of invalidDocs) {
        try {
          await db.collection('books').insertOne(doc);

          throw new Error('This should not be reached');
        } catch (e: any) {
          const expectedMessage = 'Document failed validation';
          assert.ok(e.message.includes(expectedMessage), `Expected error ${e.message} message to include "${expectedMessage}", doc: ${doc._id}`);
        }
      }
    });
  });

  describe('[All Types] Documents -> Generate basic schema -> Use schema in validation rule in MongoDB -> Validate documents against the schema', function() {
    const allTypesCollection = 'allTypes';

    before(async function() {
      await db.collection(allTypesCollection).insertOne(allBSONTypesWithEdgeCasesDoc);
      const docsFromCollection = await db.collection(allTypesCollection).find().toArray();

      // Create the schema validation rule.
      const analyzedDocuments = await analyzeDocuments(docsFromCollection);
      const schema = await analyzedDocuments.getMongoDBJsonSchema();
      const validationRule = {
        $jsonSchema: schema
      };
      // Update the collection with the schema validation.
      await db.command({
        collMod: allTypesCollection,
        validator: validationRule
      });
    });

    it('allows inserting valid documents (does not error)', async function() {
      const docs = [{
        ...allBSONTypesWithEdgeCasesDoc,
        _id: new ObjectId()
      }, {
        ...allBSONTypesWithEdgeCasesDoc,
        _id: new ObjectId()
      }];

      try {
        await db.collection(allTypesCollection).insertMany(docs);
      } catch (err) {
        console.error('Error inserting documents', EJSON.stringify(err, undefined, 2));
        throw err;
      }
    });

    it('prevents inserting invalid documents', async function() {
      const invalidDocs = [{
        _id: new ObjectId('67863e82fb817085a6b0ebba'),
        title: 'Pineapple 1',
        year: new Int32(1983),
        genres: [
          'crimi',
          'comedy',
          {
            short: 'scifi',
            long: 'science fiction'
          }
        ],
        number: 'an invalid string'
      }, {
        _id: new ObjectId('67863eacfb817085a6b0ebbb'),
        title: 'Pineapple 2',
        year: 'year a string'
      }, {
        _id: new ObjectId('67863eacfb817085a6b0ebbc'),
        title: 123,
        year: new Int32('1999')
      }, {
        _id: new ObjectId('67863eacfb817085a6b0ebbc'),
        title: 'No year'
      }];

      for (const doc of invalidDocs) {
        try {
          await db.collection(allTypesCollection).insertOne(doc);

          throw new Error('This should not be reached');
        } catch (e: any) {
          const expectedMessage = 'Document failed validation';
          assert.ok(e.message.includes(expectedMessage), `Expected error ${e.message} message to include "${expectedMessage}", doc: ${doc._id}`);
        }
      }
    });
  });
});
