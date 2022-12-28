import assert from 'assert';
import BSON from 'bson';

import getSchema from '../src';
import type { Schema, PrimitiveSchemaType } from '../src/stream';

describe('options', function() {
  const docs = [
    {
      _id: new BSON.ObjectID('55581e0a9bf712d0c2b48d71'),
      email: 'tick@duck.org',
      shape: {
        type: 'Point',
        coordinates: [20.0, 30.0]
      },
      is_verified: false
    },
    {
      _id: new BSON.ObjectID('55581e0a9bf712d0c2b48d72'),
      email: 'trick@duck.org',
      shape: {
        type: 'LineString',
        coordinates: [[20.0, 30.0], [30.0, 40.0]]
      },
      is_verified: false
    },
    {
      _id: new BSON.ObjectID('55581e0a9bf712d0c2b48d73'),
      email: 'track@duck.org',
      shape: {
        type: 'Polygon',
        coordinates: [[[20.0, 30.0], [30.0, 40.0], [15.0, 50.0], [20.0, 30.0]]]
      },
      is_verified: true
    }
  ];

  let schema: Schema;
  context('when using default options', function() {
    beforeEach(async function() {
      schema = await getSchema(docs);
    });

    it('stores values by default', function() {
      assert.equal((schema.fields[0].types[0] as PrimitiveSchemaType).values.length, 3);
    });

    it('does not use semantic type detection', function() {
      assert.equal(schema.fields.find(v => v.name === 'email')?.types[0].name, 'String');
      assert.equal((schema.fields.find(v => v.name === 'email')?.types[0] as any).bsonType, 'String');
      assert.equal(schema.fields.find(v => v.name === 'shape')?.types[0].name, 'Document');
      assert.equal((schema.fields.find(v => v.name === 'shape')?.types[0] as any).bsonType, 'Document');
    });
  });

  context('when `storeValues` is false', function() {
    beforeEach(async function() {
      schema = await getSchema(docs, { storeValues: false });
    });
    it('does not store values when `storeValues` is false', function() {
      assert.ok(!(schema.fields[0].types[0] as PrimitiveSchemaType).values);
    });
  });

  context('when `semanticTypes` is true', function() {
    beforeEach(async function() {
      schema = await getSchema(docs, { semanticTypes: true });
    });
    it('calls semantic type detection', function() {
      assert.equal(schema.fields.find(v => v.name === 'email')?.types[0].name, 'Email');
      assert.equal((schema.fields.find(v => v.name === 'email')?.types[0] as any).bsonType, 'String');
    });
  });
  context('when `semanticTypes` is an object', function() {
    context('and all values are boolean', function() {
      beforeEach(async function() {
        schema = await getSchema(docs, { semanticTypes: { email: true } });
      });
      it('only uses the enabled type detectors', function() {
        assert.equal(schema.fields.find(v => v.name === 'email')?.types[0].name, 'Email');
        assert.equal((schema.fields.find(v => v.name === 'email')?.types[0] as any).bsonType, 'String');
      });
    });
    context('and values are mixed upper/lower case', function() {
      beforeEach(async function() {
        schema = await getSchema(docs, { semanticTypes: { eMaIl: true } });
      });
      it('uses the enabled type detectors', function() {
        assert.equal(schema.fields.find(v => v.name === 'email')?.types[0].name, 'Email');
        assert.equal((schema.fields.find(v => v.name === 'email')?.types[0] as any).bsonType, 'String');
      });
    });

    context('and all values are custom detector functions', function() {
      beforeEach(async function() {
        schema = await getSchema(docs, {
          semanticTypes: {
            Verification: function(value, key) {
              return !!key?.match(/verified/);
            }
          }
        });
      });
      it('uses the custom type detectors', function() {
        assert.equal(schema.fields.find(v => v.name === 'is_verified')?.types[0].name, 'Verification');
        assert.equal((schema.fields.find(v => v.name === 'is_verified')?.types[0] as any).bsonType, 'Boolean');
        assert.equal(schema.fields.find(v => v.name === 'email')?.types[0].name, 'String');
        assert.equal((schema.fields.find(v => v.name === 'email')?.types[0] as any).bsonType, 'String');
      });
    });

    context('and values are mixed booleans and custom detector functions', function() {
      beforeEach(async function() {
        schema = await getSchema(docs, {
          semanticTypes: {
            email: true,
            Verification: function(value, key) {
              return !!key?.match(/verified/);
            }
          }
        });
      });
      it('uses the enabled and custom type detectors', function() {
        assert.equal(schema.fields.find(v => v.name === 'is_verified')?.types[0].name, 'Verification');
        assert.equal((schema.fields.find(v => v.name === 'is_verified')?.types[0] as any).bsonType, 'Boolean');
        assert.equal(schema.fields.find(v => v.name === 'email')?.types[0].name, 'Email');
        assert.equal((schema.fields.find(v => v.name === 'email')?.types[0] as any).bsonType, 'String');
      });
    });
  });
});
