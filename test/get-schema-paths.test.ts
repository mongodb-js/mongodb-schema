import assert from 'assert';
import type { Document } from 'bson';

import { getSchemaPaths } from '../src';

describe('getSchemaPaths', function() {
  let schemaPaths: string[][];

  describe('with fields with dots in them', function() {
    const docs = [
      {
        pineapple: {
          orange: {
            apple: 1
          },
          'orange.with.dot': {
            bah: 2
          }
        }
      }
    ];

    before(async function() {
      schemaPaths = await getSchemaPaths(docs);
    });

    it('returns an array of the fields', function() {
      assert.deepEqual(schemaPaths, [
        ['pineapple'],
        ['pineapple', 'orange'],
        ['pineapple', 'orange', 'apple'],
        ['pineapple', 'orange.with.dot'],
        ['pineapple', 'orange.with.dot', 'bah']
      ]);
    });
  });

  describe('with multiple documents with different fields', function() {
    const docs = [
      {
        pineapple: {
          orange: {
            apple: 1
          }
        }
      },
      {
        pineapple: {
          orange: 'ok'
        }
      },
      {
        pineapple: ['test', '123'],
        clementine: false
      }
    ];

    before(async function() {
      schemaPaths = await getSchemaPaths(docs);
    });

    it('returns all of the field paths (sorted)', function() {
      assert.deepEqual(schemaPaths, [
        ['clementine'],
        ['pineapple'],
        ['pineapple', 'orange'],
        ['pineapple', 'orange', 'apple']
      ]);
    });
  });

  describe('with nested array documents', function() {
    const docs = [
      {
        orangutan: [{
          tuatara: 'yes',
          lizard: {
            snakes: false,
            birds: false
          }
        }]
      }
    ];

    before(async function() {
      schemaPaths = await getSchemaPaths(docs);
    });

    it('returns all of the field paths (sorted)', function() {
      assert.deepEqual(schemaPaths, [
        ['orangutan'],
        ['orangutan', 'lizard'],
        ['orangutan', 'lizard', 'birds'],
        ['orangutan', 'lizard', 'snakes'],
        ['orangutan', 'tuatara']
      ]);
    });
  });

  describe('with no documents', function() {
    const docs: Document[] = [];

    before(async function() {
      schemaPaths = await getSchemaPaths(docs);
    });

    it('returns no paths', function() {
      assert.deepEqual(schemaPaths, []);
    });
  });
});
