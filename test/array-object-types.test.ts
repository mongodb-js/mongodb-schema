import getSchema from '../src';
import assert from 'assert';
import type { ArraySchemaType, Schema, SchemaField, SchemaType } from '../src/schema-analyzer';

describe('arrays and objects as type (INT-203 restructuring)', function() {
  const docs = [
    {
      x: [1, 2, 3]
    },
    {
      x: 'foo'
    },
    {
      x: {
        b: 1
      }
    },
    {
      x: ['bar', null, false]
    },
    {
      x: [{
        c: 1,
        d: 1
      }, {
        c: 2
      }]
    },
    {
      e: 1
    }
  ];
  let schema: Schema;
  before(async function() {
    schema = await getSchema(docs);
  });
  describe('Field', function() {
    let x: SchemaField | undefined;
    before(function() {
      x = schema.fields.find(v => v.name === 'x');
    });
    it('have the right type distribution of x', function() {
      const names = x?.types.map(v => v.name);
      const probabilities = x?.types.map(v => v.probability);
      const dist = names?.reduce((p, c, i) => ({ ...p, [c]: probabilities?.[i] }), {});
      assert.deepEqual(dist, {
        Array: 3 / 6,
        String: 1 / 6,
        Document: 1 / 6,
        Undefined: 1 / 6
      });
    });
  });

  describe('Nested Array', function() {
    let arr: SchemaType | undefined;

    before(function() {
      const types = schema.fields.find(v => v.name === 'x')?.types;
      arr = types?.find(v => v.name === 'Array');
    });

    it('should return the lengths of all encountered arrays', function() {
      assert.deepEqual((arr as ArraySchemaType).lengths, [3, 3, 2]);
    });

    it('should return the probability of x being an array', function() {
      assert.equal(arr?.probability, 3 / 6);
    });

    it('should return the total count of all containing values', function() {
      assert.equal((arr as ArraySchemaType).totalCount, 8);
    });

    it('should return the type distribution inside an array', function() {
      const names = (arr as ArraySchemaType).types.map(v => v.name);
      const probabilities = (arr as ArraySchemaType).types.map(v => v.probability);
      const arrDist = names.reduce((p, c, i) => ({ ...p, [c]: probabilities[i] }), {});
      assert.deepEqual(arrDist, {
        Number: 3 / 8,
        String: 1 / 8,
        Null: 1 / 8,
        Boolean: 1 / 8,
        Document: 2 / 8
      });
    });
  });
});
