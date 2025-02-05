import { analyzeDocuments } from '../../src';
import Ajv2020 from 'ajv/dist/2020';
import assert from 'assert';
import { ObjectId, Int32, Double, EJSON } from 'bson';

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

describe.only('Documents -> Generate schema -> Validate Documents against the schema', function() {
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
