import assert from 'assert';

import type { Schema } from '../src/schema-analyzer';
import getSchema from '../src';
import { allBSONTypesDoc } from './all-bson-types-fixture';

describe('using a document with all bson types', function() {
  let schema: Schema;
  before(async function() {
    schema = await getSchema([allBSONTypesDoc]);
  });

  it('contains all of the types', function() {
    assert.equal(schema.count, 1);

    const fieldTypes = [
      'Array',
      'Binary',
      'Boolean',
      'Code',
      'Date',
      'Decimal128',
      'Double',
      'Int32',
      'Long',
      'MaxKey',
      'MinKey',
      'Null',
      'Document',
      'ObjectId',
      'BSONRegExp',
      'String',
      'BSONSymbol',
      'Timestamp'
    ];

    for (const type of fieldTypes) {
      assert.equal(
        !!schema.fields.find(schemaField => schemaField.type === type),
        true,
        `Cannot find type "${type}" in schemaField types: ${JSON.stringify(schema.fields, null, 2)}`
      );
    }
  });
});
