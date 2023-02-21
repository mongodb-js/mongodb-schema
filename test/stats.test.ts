import assert from 'assert';

import getSchema from '../src';
import stats from '../src/stats';
import type { Schema } from '../src/stream';

describe('schema statistics', function() {
  describe('empty doc', function() {
    const docs = [
      {}
    ];
    let schema: Schema;
    before(async function() {
      schema = await getSchema(docs);
    });

    it('should have the correct schema width', function() {
      assert.equal(stats.width(schema), 0);
    });
    it('should have the correct schema depth', function() {
      assert.equal(stats.depth(schema), 0);
    });
  });
  describe('doc with one key', function() {
    const docs = [
      {
        foo: 'bar'
      }
    ];
    let schema: Schema;
    before(async function() {
      schema = await getSchema(docs);
    });

    it('should have the correct schema width', function() {
      assert.equal(stats.width(schema), 1);
    });
    it('should have the correct schema depth', function() {
      assert.equal(stats.depth(schema), 1);
    });
  });
  describe('example 1', function() {
    const docs = [
      {
        one: [
          'foo',
          'bar',
          {
            two: {
              three: 3
            }
          },
          'baz'
        ],
        foo: 'bar'
      }
    ];
    let schema: Schema;
    before(async function() {
      schema = await getSchema(docs);
    });

    it('should have the correct schema width', function() {
      assert.equal(stats.width(schema), 4);
    });
    it('should have the correct schema depth', function() {
      assert.equal(stats.depth(schema), 3);
    });
  });
  describe('example 2', function() {
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

    it('should have the correct schema width', function() {
      assert.equal(stats.width(schema), 5);
    });
    it('should have the correct schema depth', function() {
      assert.equal(stats.depth(schema), 2);
    });
  });
  describe('example 3', function() {
    const docs = [
      {
        a: 1,
        b: false,
        one: {
          c: null,
          two: {
            three: {
              four: 4,
              e: 'deepest nesting level'
            }
          }
        },
        f: {
          g: 'not the deepest level'
        }
      }
    ];
    let schema: Schema;
    before(async function() {
      schema = await getSchema(docs);
    });

    it('should have the correct schema width', function() {
      assert.equal(stats.width(schema), 10);
    });
    it('should have the correct schema depth', function() {
      assert.equal(stats.depth(schema), 4);
    });
  });
  describe('example 4', function() {
    const docs = [
      {
        a: {
          b: [{
            c: {
              d: [{
                e: {
                  f: [{
                    g: [1, 2, 3]
                  }]
                }
              }]
            }
          }]
        }
      }
    ];
    let schema: Schema;
    before(async function() {
      schema = await getSchema(docs);
    });

    it('should have the correct schema width', function() {
      assert.equal(stats.width(schema), 7);
    });
    it('should have the correct schema depth', function() {
      assert.equal(stats.depth(schema), 7);
    });
  });
});
