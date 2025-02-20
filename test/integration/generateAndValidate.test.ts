import { analyzeDocuments } from '../../src';
import Ajv2020 from 'ajv/dist/2020';
import assert from 'assert';
import { ObjectId, Int32, Double, EJSON } from 'bson';
import { MongoCluster } from 'mongodb-runner';
import { MongoClient, type Db } from 'mongodb';
import path from 'path';
import os from 'os';

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

describe('Documents -> Generate schema -> Use schema in validation rule in MongoDB -> Validate documents against the schema', function() {
  let cluster: MongoCluster | undefined;
  let client: MongoClient;
  let db: Db;

  before(async function() {
    // Create the schema validation rule.
    const analyzedDocuments = await analyzeDocuments(bsonDocuments);
    const schema = await analyzedDocuments.getMongoDBJsonSchema();
    const validationRule = {
      $jsonSchema: schema
    };

    // Connect to the mongodb instance.
    cluster = await MongoCluster.start({
      topology: 'standalone',
      tmpDir: path.join(
        os.tmpdir(),
        'mongodb-schema-test'
      )
    });
    const connectionString = cluster.connectionString;
    client = new MongoClient(connectionString);
    await client.connect();
    db = client.db('test');

    // Create a collection with the schema validation in Compass.
    await db.createCollection('books', {
      validator: validationRule
    });
  });
  after(async function() {
    await db?.collection('books').drop();
    await client?.close();
    await cluster?.close();
    cluster = undefined;
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
