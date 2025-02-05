import { analyzeDocuments } from '../../src';
import Ajv2020 from 'ajv/dist/2020';
import assert from 'assert';

const documents = [{
  _id: {
    $oid: '67863e82fb817085a6b0ebad'
  },
  title: 'My book',
  year: 1983,
  genres: [
    'crimi',
    'comedy',
    {
      short: 'scifi',
      long: 'science fiction'
    }
  ],
  number: {
    $numberDouble: 'Infinity'
  }
},
{
  _id: {
    $oid: '67863eacfb817085a6b0ebae'
  },
  title: 'Other book',
  year: 1999,
  author: {
    name: 'Peter Sonder',
    rating: 1.3
  }
}];

describe('Documents -> Generate schema -> Validate Documents against the schema', function() {
  it('Standard JSON Schema with Relaxed EJSON', async function() {
    const ajv = new Ajv2020();
    const analyzedDocuments = await analyzeDocuments(documents);
    const schema = await analyzedDocuments.getStandardJsonSchema();
    const validate = ajv.compile(schema);
    for (const doc of documents) {
      assert.strictEqual(validate(doc), true);
    }
  });
});
