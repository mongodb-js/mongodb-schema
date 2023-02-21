import assert from 'assert';

import type { SchemaField } from '../src/stream';
import getSchema from '../src';

describe('mixed type order', function() {
  const docs = [
    {
      _id: 2
    },
    {
      _id: 3,
      registered: '1'
    },
    {
      _id: 4,
      registered: '1'
    },
    {
      _id: 1,
      registered: 1
    }
  ];

  let registered: SchemaField | undefined;
  before(async function() {
    const schema = await getSchema(docs);
    registered = schema.fields.find(v => v.name === 'registered');

    if (!registered) {
      throw new Error('Did not pick up `registered` field');
    }
    if (!registered.types.find(v => v.name === 'Undefined')) {
      throw new Error('Missing Undefined type on `registered`');
    }
  });
  it('should have 3 types for `registered`', function() {
    assert.equal(registered?.types.length, 3);
  });
  it('should return the order of types as ["String", "Number", "Undefined"]', function(done) {
    assert.deepEqual(registered?.types.map(v => v.name),
      ['String', 'Number', 'Undefined']);
    done();
  });
});
