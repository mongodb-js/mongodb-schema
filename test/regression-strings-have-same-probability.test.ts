import assert from 'assert';

import getSchema from '../src';
import type { Schema, PrimitiveSchemaType } from '../src/schema-analyzer';

describe('regression', function() {
  describe('strings have same probability', function() {
    const docs = [
      {
        _id: 1,
        value: 'DUPE'
      },
      {
        _id: 2,
        value: 'DUPE'
      },
      {
        _id: 3,
        value: 'DUPE'
      }
    ];

    let schema: Schema;
    before(async function() {
      schema = await getSchema(docs);
    });

    it('should not dedupe values but return all 3 of them', function() {
      const types = schema.fields.find(v => v.name === 'value')?.types;
      assert.equal((types?.find(v => v.name === 'String') as PrimitiveSchemaType)?.values.length, 3);
    });
  });
});
