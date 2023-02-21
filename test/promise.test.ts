import assert from 'assert';

import type { Schema } from '../src/stream';
import getSchema from '../src';

describe('getSchema should return promise', function() {
  const docs = [
    { foo: 'bar' },
    { country: 'Croatia' },
    { country: 'Croatia' },
    { country: 'England' }
  ];

  it('Check if return value is a promise', function() {
    const result = getSchema(docs);
    assert.strictEqual(result instanceof Promise, true);
  });

  it('Check that promise returns expected schema', async function() {
    const result = await getSchema(docs);
    const fieldNames = result.fields.map(v => v.name);
    assert.deepStrictEqual(fieldNames, ['country', 'foo']);
  });

  describe('Check promise success', function() {
    let response: Schema;

    before(async function() {
      response = await getSchema(docs);
    });

    it('Using promise should succeed', function() {
      assert.equal(response.count, 4);
      assert.equal(response.fields.length, 2);
    });
  });

  describe('Check failure', function() {
    let errMsg: string | undefined;

    before(async function() {
      try {
        await getSchema({ foo: 'bar' } as any);
      } catch (err: any) {
        errMsg = err?.message;
      }
    });

    it('Using promise should give an error message', function() {
      assert.strictEqual(errMsg, 'Unknown input type for `docs`. Must be an array, stream or MongoDB Cursor.');
    });
  });
});
