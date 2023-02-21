import assert from 'assert';

import getSchema from '../src';
import type { Schema, SchemaField } from '../src/stream';

describe('mixed type probability', function() {
  const docs = [
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
      _id: 4,
      assigned: true
    }
  ];

  let schema: Schema;
  let registered: SchemaField | undefined;
  before(async function() {
    schema = await getSchema(docs);
    registered = schema.fields.find(v => v.name === 'registered');

    if (!registered) {
      throw new Error('Did not pick up `registered` field');
    }
    if (!registered.types.find(v => v.name === 'Undefined')) {
      throw new Error('Missing Undefined type on `registered`');
    }
  });
  it('should have 4 types for `registered`', function() {
    assert.equal(registered?.types.length, 4);
  });
  it('should have a probability of 25% for `registered` to be a boolean', function() {
    assert.equal(registered?.types.find(v => v.name === 'Boolean')?.probability, 1 / 4);
  });
  it('should have a probability of 25% for `registered` to be a number', function() {
    assert.equal(registered?.types.find(v => v.name === 'Number')?.probability, 1 / 4);
  });
  it('should have a probability of 25% for `registered` to be a string', function() {
    assert.equal(registered?.types.find(v => v.name === 'String')?.probability, 1 / 4);
  });
  it('should have a probability of 25% for `registered` to be undefined', function() {
    assert.equal(registered?.types.find(v => v.name === 'Undefined')?.probability, 1 / 4);
  });
  it('should compensate for missed Undefined values', function() {
    const assigned = schema.fields.find(v => v.name === 'assigned');
    assert.equal(assigned?.probability, 0.25);
    assert.equal(assigned?.types.find(v => v.name === 'Boolean')?.probability, 0.25);
  });
});
