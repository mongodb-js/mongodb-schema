import assert from 'assert';

import { getSchemaPaths } from '../src';

describe('getSchemaPaths', function() {
  describe('with fields with dots in them', function() {
    let schemaPaths: string[][];
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
    let schemaPaths: string[][];
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

    it('returns all of the field paths', function() {
      assert.deepEqual(schemaPaths, [
        ['pineapple'],
        ['pineapple', 'orange'],
        ['pineapple', 'orange', 'apple'],
        ['clementine']
      ]);
    });
  });

  describe('with nested array documents', function() {
    let schemaPaths: string[][];
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

    it('returns all of the field paths', function() {
      assert.deepEqual(schemaPaths, [
        ['orangutan'],
        ['orangutan', 'tuatara'],
        ['orangutan', 'lizard'],
        ['orangutan', 'lizard', 'snakes'],
        ['orangutan', 'lizard', 'birds']
      ]);
    });
  });
});
