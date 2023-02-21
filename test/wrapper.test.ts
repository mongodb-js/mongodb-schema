import assert from 'assert';

import getSchema from '../src';

describe('Convenience Wrapper', function() {
  it('should be available as a function', function() {
    assert.ok(getSchema);
    assert.equal(typeof getSchema, 'function');
  });

  it('should accept documents as an array and return a schema', async function() {
    const res = await getSchema([{
      a: 1
    }, {
      a: 2,
      b: false
    }]);
    assert.ok(res);
    assert.equal(typeof res, 'object');
    assert.ok(!!res.count);
    assert.ok(!!res.fields);
    assert.equal(res.count, 2);
  });

  it('should return an error when no documents are provided', async function() {
    try {
      await getSchema('' as any);
      assert(false); // Should error.
    } catch (err) {
      assert.ok(err);
    }
  });
});
