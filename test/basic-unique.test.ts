import assert from 'assert';
import bson from 'bson';

import getSchema from '../src';
import type { Schema, PrimitiveSchemaType } from '../src/stream';

describe('has_duplicates', function() {
  const docs: {
    num: number;
    str: string;
  }[] = [];
  for (let i = 0; i <= 11111; i++) {
    docs.push({
      num: i,
      str: String(i)
    });
  }

  let schema: Schema;
  before(async function() {
    schema = await getSchema(docs);
  });

  it('should not have duplicates', function() {
    assert.equal(schema.fields.find(v => v.name === 'num')?.has_duplicates, false);
  });

  it('should have 10000 number values for the `num` field', function() {
    const types = schema.fields.find(v => v.name === 'num')?.types;
    assert.equal((types?.find(v => v.name === 'Number') as PrimitiveSchemaType)?.values.length, 10000);
  });

  it('should have 100 string values for the `str` field', function() {
    const types = schema.fields.find(v => v.name === 'str')?.types;
    assert.equal((types?.find(v => v.name === 'String') as PrimitiveSchemaType)?.values.length, 100);
  });
});

describe('unique', function() {
  const docs = [
    {
      _id: 1,
      registered: true,
      b: false,
      int32: new bson.Int32(5),
      date: new Date('2016-01-01')
    },
    {
      _id: 2,
      registered: true,
      code: null,
      b: 'false',
      int32: new bson.Int32(5),
      date: new Date('2016-01-01')
    },
    {
      _id: 3,
      code: null,
      int32: new bson.Int32(9),
      date: new Date('2011-11-11')
    }
  ];

  let schema: Schema;
  before(async function() {
    schema = await getSchema(docs);
  });

  it('should have count of 3 for `_id`', function() {
    assert.equal(schema.fields.find(v => v.name === '_id')?.count, 3);
  });

  it('should have unique of 3 for `_id`', function() {
    const types = schema.fields.find(v => v.name === '_id')?.types;
    assert.equal(types?.find(v => v.name === 'Number')?.unique, 3);
  });

  it('should not have duplicates for `_id`', function() {
    assert.equal(schema.fields.find(v => v.name === '_id')?.has_duplicates, false);
  });

  it('should have count of 2 for `registered`', function() {
    assert.equal(schema.fields.find(v => v.name === 'registered')?.count, 2);
  });

  it('should have unique of 1 for `registered` type Boolean', function() {
    const types = schema.fields.find(v => v.name === 'registered')?.types;
    assert.equal(types?.find(v => v.name === 'Boolean')?.unique, 1);
  });

  it('should have unique of 1 for `code`', function() {
    const types = schema.fields.find(v => v.name === 'code')?.types;
    assert.equal(types?.find(v => v.name === 'Null')?.unique, 1);
  });

  it('should have unique of 2 for `int32`', function() {
    const types = schema.fields.find(v => v.name === 'int32')?.types;
    assert.equal(types?.find(v => v.name === 'Int32')?.unique, 2);
  });

  it('should have unique of 2 for `date`', function() {
    const types = schema.fields.find(v => v.name === 'date')?.types;
    assert.equal(types?.find(v => v.name === 'Date')?.unique, 2);
  });

  it('should not have duplicate values for b', function() {
    assert.equal(schema.fields.find(v => v.name === 'b')?.has_duplicates, false);
  });

  it('should have duplicates for `registered`', function() {
    assert.equal(schema.fields.find(v => v.name === 'registered')?.has_duplicates, true);
  });
});
