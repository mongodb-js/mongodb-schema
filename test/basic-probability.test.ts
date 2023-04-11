import assert from 'assert';

import getSchema from '../src';
import type { Schema } from '../src/schema-analyzer';

describe('simple probability', function() {
  const docs = [
    {
      _id: 1,
      registered: true
    },
    {
      _id: 2
    }
  ];

  let schema: Schema;
  before(async function() {
    schema = await getSchema(docs);

    if (!schema.fields.find(v => v.name === 'registered')) {
      throw new Error('Did not pick up `registered` field');
    }
  });
  it('should have a probability of 50% for `registered` to be a boolean', function() {
    const types = schema.fields.find(v => v.name === 'registered')?.types;
    assert.equal(types?.find(v => v.name === 'Boolean')?.probability, 1 / 2);
  });
  it('should have a probability of 50% for `registered` to be undefined', function() {
    const types = schema.fields.find(v => v.name === 'registered')?.types;
    assert.equal(types?.find(v => v.name === 'Undefined')?.probability, 1 / 2);
  });
});
