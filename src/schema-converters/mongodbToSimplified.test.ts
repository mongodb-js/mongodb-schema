import assert from 'assert';
import { analyzeDocuments, getSimplifiedSchema, SimplifiedSchema } from '..';
import { allBSONTypesDoc } from '../../test/all-bson-types-fixture';
import { convertMongoDBJSONSchemaToSimplified } from './mongodbToSimplified';

describe('convertMongoDBJSONSchemaToSimplified', function() {
  describe('bsonType mapping', function() {
    it('maps flat scalar properties to their inference type names', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          str: { bsonType: 'string' },
          int: { bsonType: 'int' },
          lng: { bsonType: 'long' },
          dbl: { bsonType: 'double' },
          dec: { bsonType: 'decimal' },
          bool: { bsonType: 'bool' },
          oid: { bsonType: 'objectId' },
          dt: { bsonType: 'date' },
          nul: { bsonType: 'null' },
          rx: { bsonType: 'regex' },
          sym: { bsonType: 'symbol' },
          js: { bsonType: 'javascript' },
          jsws: { bsonType: 'javascriptWithScope' },
          bin: { bsonType: 'binData' },
          ts: { bsonType: 'timestamp' },
          mink: { bsonType: 'minKey' },
          maxk: { bsonType: 'maxKey' },
          undef: { bsonType: 'undefined' }
        }
      });

      assert.deepEqual(result, {
        str: { types: [{ bsonType: 'String' }] },
        int: { types: [{ bsonType: 'Int32' }] },
        lng: { types: [{ bsonType: 'Long' }] },
        dbl: { types: [{ bsonType: 'Double' }] },
        dec: { types: [{ bsonType: 'Decimal128' }] },
        bool: { types: [{ bsonType: 'Boolean' }] },
        oid: { types: [{ bsonType: 'ObjectId' }] },
        dt: { types: [{ bsonType: 'Date' }] },
        nul: { types: [{ bsonType: 'Null' }] },
        rx: { types: [{ bsonType: 'BSONRegExp' }] },
        sym: { types: [{ bsonType: 'BSONSymbol' }] },
        js: { types: [{ bsonType: 'Code' }] },
        jsws: { types: [{ bsonType: 'CodeWScope' }] },
        bin: { types: [{ bsonType: 'Binary' }] },
        ts: { types: [{ bsonType: 'Timestamp' }] },
        mink: { types: [{ bsonType: 'MinKey' }] },
        maxk: { types: [{ bsonType: 'MaxKey' }] },
        undef: { types: [{ bsonType: 'Undefined' }] }
      });
    });

    it('maps the numeric "number" alias to Double', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: { n: { bsonType: 'number' } }
      });

      assert.deepEqual(result, { n: { types: [{ bsonType: 'Double' }] } });
    });

    it('produces one type entry per alias when bsonType is an array', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: { mixed: { bsonType: ['string', 'int', 'null'] } }
      });

      assert.deepEqual(result, {
        mixed: {
          types: [
            { bsonType: 'String' },
            { bsonType: 'Int32' },
            { bsonType: 'Null' }
          ]
        }
      });
    });

    it('deduplicates repeated aliases within a bsonType array', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: { n: { bsonType: ['int', 'int'] } }
      });

      assert.deepEqual(result, { n: { types: [{ bsonType: 'Int32' }] } });
    });

    it('maps dbPointer to DBRef, inverting internalToMongoDB', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: { ptr: { bsonType: 'dbPointer' } }
      });

      assert.deepEqual(result, { ptr: { types: [{ bsonType: 'DBRef' }] } });
    });

    it('drops unrecognised bsonType aliases without throwing', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: { weird: { bsonType: ['nonsense', 'string'] } }
      });

      assert.deepEqual(result, { weird: { types: [{ bsonType: 'String' }] } });
    });
  });

  describe('standard "type" keyword fallback', function() {
    it('falls back to type when bsonType is absent', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          s: { type: 'string' },
          n: { type: 'number' },
          i: { type: 'integer' },
          b: { type: 'boolean' },
          nul: { type: 'null' },
          o: { type: 'object', properties: { a: { type: 'string' } } },
          a: { type: 'array', items: { type: 'string' } }
        }
      });

      assert.deepEqual(result, {
        s: { types: [{ bsonType: 'String' }] },
        n: { types: [{ bsonType: 'Double' }] },
        i: { types: [{ bsonType: 'Int32' }] },
        b: { types: [{ bsonType: 'Boolean' }] },
        nul: { types: [{ bsonType: 'Null' }] },
        o: {
          types: [{
            bsonType: 'Document',
            fields: { a: { types: [{ bsonType: 'String' }] } }
          }]
        },
        a: {
          types: [{ bsonType: 'Array', types: [{ bsonType: 'String' }] }]
        }
      });
    });

    it('prefers bsonType over type when both are present', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: { n: { bsonType: 'long', type: 'number' } }
      });

      assert.deepEqual(result, { n: { types: [{ bsonType: 'Long' }] } });
    });
  });

  describe('documents', function() {
    it('recurses into nested properties', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          outer: {
            bsonType: 'object',
            properties: {
              inner: { bsonType: 'object', properties: { leaf: { bsonType: 'int' } } }
            }
          }
        }
      });

      assert.deepEqual(result, {
        outer: {
          types: [{
            bsonType: 'Document',
            fields: {
              inner: {
                types: [{
                  bsonType: 'Document',
                  fields: { leaf: { types: [{ bsonType: 'Int32' }] } }
                }]
              }
            }
          }]
        }
      });
    });

    it('emits an empty fields map for an object with no properties', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: { o: { bsonType: 'object' } }
      });

      assert.deepEqual(result, {
        o: { types: [{ bsonType: 'Document', fields: {} }] }
      });
    });

    it('returns an empty schema for a root with no properties', function() {
      assert.deepEqual(
        convertMongoDBJSONSchemaToSimplified({ bsonType: 'object' }),
        {}
      );
      assert.deepEqual(convertMongoDBJSONSchemaToSimplified({}), {});
    });

    it('uses null-prototype field maps, as inference does', function() {
      // Matches `simplifiedSchema` in schema-analyzer.ts, so that field names
      // like `__proto__` or `constructor` cannot collide with object internals.
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          nested: { bsonType: 'object', properties: { a: { bsonType: 'int' } } }
        }
      });

      assert.strictEqual(Object.getPrototypeOf(result), null);
      const nested = result.nested.types[0] as { fields: Record<string, unknown> };
      assert.strictEqual(Object.getPrototypeOf(nested.fields), null);
    });

    it('handles a field literally named __proto__', function() {
      // Built via JSON.parse because `__proto__` in an object literal invokes
      // the prototype setter instead of creating an own property. A validator
      // read off a collection arrives as an own property, as here.
      const result = convertMongoDBJSONSchemaToSimplified(JSON.parse(
        '{"bsonType":"object","properties":{"__proto__":{"bsonType":"string"}}}'
      ));

      assert.deepEqual(Object.keys(result), ['__proto__']);
      assert.deepEqual(
        Object.getOwnPropertyDescriptor(result, '__proto__')?.value,
        { types: [{ bsonType: 'String' }] }
      );
    });
  });

  describe('arrays', function() {
    it('reads member types from a single items schema', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: { a: { bsonType: 'array', items: { bsonType: 'string' } } }
      });

      assert.deepEqual(result, {
        a: { types: [{ bsonType: 'Array', types: [{ bsonType: 'String' }] }] }
      });
    });

    it('unions member types across a tuple items form', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          a: { bsonType: 'array', items: [{ bsonType: 'string' }, { bsonType: 'int' }] }
        }
      });

      assert.deepEqual(result, {
        a: {
          types: [{
            bsonType: 'Array',
            types: [{ bsonType: 'String' }, { bsonType: 'Int32' }]
          }]
        }
      });
    });

    it('emits an empty member type list for an array with no items', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: { a: { bsonType: 'array' } }
      });

      assert.deepEqual(result, {
        a: { types: [{ bsonType: 'Array', types: [] }] }
      });
    });

    it('recurses through nested arrays of documents', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          matrix: {
            bsonType: 'array',
            items: {
              bsonType: 'array',
              items: { bsonType: 'object', properties: { x: { bsonType: 'int' } } }
            }
          }
        }
      });

      assert.deepEqual(result, {
        matrix: {
          types: [{
            bsonType: 'Array',
            types: [{
              bsonType: 'Array',
              types: [{
                bsonType: 'Document',
                fields: { x: { types: [{ bsonType: 'Int32' }] } }
              }]
            }]
          }]
        }
      });
    });
  });

  describe('unions', function() {
    it('flattens anyOf into a type union', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          n: { anyOf: [{ bsonType: 'int' }, { bsonType: 'long' }] }
        }
      });

      assert.deepEqual(result, {
        n: { types: [{ bsonType: 'Int32' }, { bsonType: 'Long' }] }
      });
    });

    it('treats oneOf as a union', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          n: { oneOf: [{ bsonType: 'int' }, { bsonType: 'string' }] }
        }
      });

      assert.deepEqual(result, {
        n: { types: [{ bsonType: 'Int32' }, { bsonType: 'String' }] }
      });
    });

    it('treats allOf as a union rather than an intersection', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          n: { allOf: [{ bsonType: 'int' }, { bsonType: 'string' }] }
        }
      });

      assert.deepEqual(result, {
        n: { types: [{ bsonType: 'Int32' }, { bsonType: 'String' }] }
      });
    });

    it('merges the field maps of two document branches into one Document type', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          d: {
            anyOf: [
              { bsonType: 'object', properties: { a: { bsonType: 'int' } } },
              { bsonType: 'object', properties: { b: { bsonType: 'string' } } }
            ]
          }
        }
      });

      assert.deepEqual(result, {
        d: {
          types: [{
            bsonType: 'Document',
            fields: {
              a: { types: [{ bsonType: 'Int32' }] },
              b: { types: [{ bsonType: 'String' }] }
            }
          }]
        }
      });
    });

    it('merges the type unions of a field present in both document branches', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          d: {
            anyOf: [
              { bsonType: 'object', properties: { a: { bsonType: 'int' } } },
              { bsonType: 'object', properties: { a: { bsonType: 'string' } } }
            ]
          }
        }
      });

      assert.deepEqual(result, {
        d: {
          types: [{
            bsonType: 'Document',
            fields: { a: { types: [{ bsonType: 'Int32' }, { bsonType: 'String' }] } }
          }]
        }
      });
    });

    it('merges the member types of two array branches into one Array type', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          a: {
            anyOf: [
              { bsonType: 'array', items: { bsonType: 'int' } },
              { bsonType: 'array', items: { bsonType: 'string' } }
            ]
          }
        }
      });

      assert.deepEqual(result, {
        a: {
          types: [{
            bsonType: 'Array',
            types: [{ bsonType: 'Int32' }, { bsonType: 'String' }]
          }]
        }
      });
    });

    it('combines a bsonType array with an anyOf at the same position', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          f: {
            bsonType: ['null', 'int'],
            anyOf: [{ bsonType: 'string' }, { bsonType: 'int' }]
          }
        }
      });

      assert.deepEqual(result, {
        f: {
          types: [
            { bsonType: 'Null' },
            { bsonType: 'Int32' },
            { bsonType: 'String' }
          ]
        }
      });
    });

    it('recurses into unions nested inside array items', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          a: {
            bsonType: 'array',
            items: { anyOf: [{ bsonType: 'int' }, { bsonType: 'string' }] }
          }
        }
      });

      assert.deepEqual(result, {
        a: {
          types: [{
            bsonType: 'Array',
            types: [{ bsonType: 'Int32' }, { bsonType: 'String' }]
          }]
        }
      });
    });
  });

  describe('constructs that carry no type information', function() {
    it('omits a field whose subschema yields no types', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          kept: { bsonType: 'string' },
          enumOnly: { enum: ['a', 'b'] },
          rangeOnly: { minimum: 0, maximum: 10 },
          patternOnly: { pattern: '^a' },
          empty: {},
          notOnly: { not: { bsonType: 'string' } }
        }
      } as any);

      // Asserted explicitly rather than via deepEqual, which treats an
      // `undefined`-valued key as absent.
      assert.deepEqual(Object.keys(result), ['kept']);
      assert.deepEqual(result, {
        kept: { types: [{ bsonType: 'String' }] }
      });
    });

    it('ignores value constraints alongside a bsonType', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          s: { bsonType: 'string', minLength: 1, maxLength: 5, pattern: '^a', enum: ['aa'] },
          n: { bsonType: 'int', minimum: 0, maximum: 10, multipleOf: 2 }
        }
      } as any);

      assert.deepEqual(result, {
        s: { types: [{ bsonType: 'String' }] },
        n: { types: [{ bsonType: 'Int32' }] }
      });
    });

    it('ignores required, title and description', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        title: 'A thing',
        description: 'described',
        required: ['a', 'missingFromProperties'],
        properties: {
          a: { bsonType: 'string', title: 'A', description: 'd' }
        }
      });

      assert.deepEqual(result, { a: { types: [{ bsonType: 'String' }] } });
    });

    it('ignores patternProperties, whose field names are unknowable', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          tags: {
            bsonType: 'object',
            patternProperties: { '^t': { bsonType: 'string' } }
          }
        }
      } as any);

      assert.deepEqual(result, {
        tags: { types: [{ bsonType: 'Document', fields: {} }] }
      });
    });

    it('ignores additionalProperties', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          o: {
            bsonType: 'object',
            properties: { a: { bsonType: 'int' } },
            additionalProperties: false
          }
        }
      } as any);

      assert.deepEqual(result, {
        o: {
          types: [{
            bsonType: 'Document',
            fields: { a: { types: [{ bsonType: 'Int32' }] } }
          }]
        }
      });
    });
  });

  describe('root', function() {
    it('reads the root as a document when it is untyped', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        properties: { a: { bsonType: 'int' } }
      });

      assert.deepEqual(result, { a: { types: [{ bsonType: 'Int32' }] } });
    });

    it('merges the properties of root anyOf branches', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        anyOf: [
          { properties: { kind: { bsonType: 'string' }, a: { bsonType: 'int' } } },
          { properties: { kind: { bsonType: 'string' }, b: { bsonType: 'string' } } }
        ]
      });

      assert.deepEqual(result, {
        kind: { types: [{ bsonType: 'String' }] },
        a: { types: [{ bsonType: 'Int32' }] },
        b: { types: [{ bsonType: 'String' }] }
      });
    });

    it('merges root allOf branches into the root properties', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: { a: { bsonType: 'int' } },
        allOf: [
          { properties: { b: { bsonType: 'string' } } },
          { bsonType: 'object', properties: { a: { bsonType: 'long' } } }
        ]
      });

      assert.deepEqual(result, {
        a: { types: [{ bsonType: 'Int32' }, { bsonType: 'Long' }] },
        b: { types: [{ bsonType: 'String' }] }
      });
    });

    it('keeps a null-prototype result when built from branches', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        oneOf: [{ properties: { a: { bsonType: 'int' } } }]
      });

      assert.strictEqual(Object.getPrototypeOf(result), null);
    });
  });

  describe('untyped subschemas', function() {
    it('implies a Document from properties', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          addr: { properties: { city: { bsonType: 'string' } } }
        }
      });

      assert.deepEqual(result, {
        addr: {
          types: [{
            bsonType: 'Document',
            fields: { city: { types: [{ bsonType: 'String' }] } }
          }]
        }
      });
    });

    it('implies an Array from items', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: { tags: { items: { bsonType: 'string' } } }
      });

      assert.deepEqual(result, {
        tags: { types: [{ bsonType: 'Array', types: [{ bsonType: 'String' }] }] }
      });
    });

    it('merges untyped branch properties into the parent Document', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          d: {
            bsonType: 'object',
            properties: { shared: { bsonType: 'bool' } },
            oneOf: [
              { properties: { a: { bsonType: 'int' } } },
              { properties: { b: { bsonType: 'string' } } }
            ]
          }
        }
      });

      assert.deepEqual(result, {
        d: {
          types: [{
            bsonType: 'Document',
            fields: {
              shared: { types: [{ bsonType: 'Boolean' }] },
              a: { types: [{ bsonType: 'Int32' }] },
              b: { types: [{ bsonType: 'String' }] }
            }
          }]
        }
      });
    });

    it('does not invent a Document from an untyped branch of a scalar', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          s: { bsonType: 'string', anyOf: [{ properties: { a: { bsonType: 'int' } } }] }
        }
      });

      assert.deepEqual(result, { s: { types: [{ bsonType: 'String' }] } });
    });

    it('refines only the matching type of a multi-typed parent', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          f: {
            bsonType: ['object', 'null'],
            allOf: [{ properties: { a: { bsonType: 'int' } } }]
          }
        }
      });

      assert.deepEqual(result, {
        f: {
          types: [
            { bsonType: 'Document', fields: { a: { types: [{ bsonType: 'Int32' }] } } },
            { bsonType: 'Null' }
          ]
        }
      });
    });
  });

  describe('validator-specific constructs', function() {
    it('maps CSFLE encrypt fields to Binary', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          ssn: { encrypt: { bsonType: 'string', keyId: [], algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic' } }
        }
      });

      assert.deepEqual(result, { ssn: { types: [{ bsonType: 'Binary' }] } });
    });

    it('includes additionalItems in the array member types', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          t: {
            bsonType: 'array',
            items: [{ bsonType: 'int' }],
            additionalItems: { bsonType: 'string' }
          }
        }
      });

      assert.deepEqual(result, {
        t: {
          types: [{
            bsonType: 'Array',
            types: [{ bsonType: 'Int32' }, { bsonType: 'String' }]
          }]
        }
      });
    });

    it('ignores a boolean additionalItems', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          t: { bsonType: 'array', items: [{ bsonType: 'int' }], additionalItems: false }
        }
      });

      assert.deepEqual(result, {
        t: { types: [{ bsonType: 'Array', types: [{ bsonType: 'Int32' }] }] }
      });
    });

    it('maps a document with $ref and $id to DBRef, as js-bson deserialises it', function() {
      const dbRefShape = {
        bsonType: 'object',
        properties: { $ref: { bsonType: 'string' }, $id: { bsonType: 'objectId' } }
      };
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          ref: dbRefShape,
          refs: { bsonType: 'array', items: dbRefShape },
          both: { anyOf: [dbRefShape, { bsonType: 'dbPointer' }] }
        }
      });

      assert.deepEqual(result, {
        ref: { types: [{ bsonType: 'DBRef' }] },
        refs: { types: [{ bsonType: 'Array', types: [{ bsonType: 'DBRef' }] }] },
        both: { types: [{ bsonType: 'DBRef' }] }
      });
    });

    it('keeps a document with only $ref as a Document', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          r: { bsonType: 'object', properties: { $ref: { bsonType: 'string' } } }
        }
      });

      assert.deepEqual(result, {
        r: {
          types: [{
            bsonType: 'Document',
            fields: { $ref: { types: [{ bsonType: 'String' }] } }
          }]
        }
      });
    });
  });

  describe('robustness', function() {
    it('falls back to type when every bsonType alias is unrecognised', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: { f: { bsonType: 'nonsense', type: 'string' } }
      });

      assert.deepEqual(result, { f: { types: [{ bsonType: 'String' }] } });
    });

    it('does not resolve aliases to Object.prototype members', function() {
      const result = convertMongoDBJSONSchemaToSimplified({
        bsonType: 'object',
        properties: {
          a: { bsonType: 'constructor' },
          b: { bsonType: ['toString', 'int'] }
        }
      });

      assert.deepEqual(Object.keys(result), ['b']);
      assert.deepEqual(result.b, { types: [{ bsonType: 'Int32' }] });
    });

    it('skips malformed subschemas without throwing', function() {
      const result = convertMongoDBJSONSchemaToSimplified(JSON.parse(JSON.stringify({
        bsonType: 'object',
        properties: {
          nullSchema: null,
          boolSchema: true,
          nullBranch: { anyOf: [null, { bsonType: 'int' }] },
          objectAnyOf: { bsonType: 'string', anyOf: { bsonType: 'int' } },
          badItems: { bsonType: 'array', items: [null, 'x', { bsonType: 'int' }] },
          badProperties: { bsonType: 'object', properties: ['a'] }
        }
      })));

      assert.deepEqual(result, {
        nullBranch: { types: [{ bsonType: 'Int32' }] },
        objectAnyOf: { types: [{ bsonType: 'String' }] },
        badItems: { types: [{ bsonType: 'Array', types: [{ bsonType: 'Int32' }] }] },
        badProperties: { types: [{ bsonType: 'Document', fields: {} }] }
      });
    });

    it('tolerates a non-object root', function() {
      assert.deepEqual(convertMongoDBJSONSchemaToSimplified(null as any), {});
    });
  });

  // The load-bearing test: pins this converter's output vocabulary to the one
  // inference produces, so a consumer reading a validator sees the same type
  // names it would have got from sampling documents.
  describe('round trip through inference', function() {
    let inferred: SimplifiedSchema;
    let viaValidator: SimplifiedSchema;

    before(async function() {
      const accessor = await analyzeDocuments([allBSONTypesDoc]);
      inferred = await getSimplifiedSchema([allBSONTypesDoc]);
      viaValidator = convertMongoDBJSONSchemaToSimplified(
        await accessor.getMongoDBJsonSchema()
      );
    });

    it('describes exactly the same fields', function() {
      assert.deepEqual(
        Object.keys(viaValidator).sort(),
        Object.keys(inferred).sort()
      );
    });

    it('reproduces the inferred schema, bar one irreducible difference', function() {
      // `array: [1, 2, 3]` holds plain JS numbers, which inference names
      // `Number`. internalToMongoDB collapses both `Number` and `Double` onto
      // `double`, so this cannot be inverted; `Double` is what a validator
      // saying `double` means, and is what comes back.
      const expected = {
        ...inferred,
        array: { types: [{ bsonType: 'Array', types: [{ bsonType: 'Double' }] }] }
      };

      assert.deepEqual(viaValidator, expected);
    });

    it('round trips DBRef, which internalToMongoDB writes as dbPointer', function() {
      assert.deepEqual(inferred.dbRef, { types: [{ bsonType: 'DBRef' }] });
      assert.deepEqual(viaValidator.dbRef, { types: [{ bsonType: 'DBRef' }] });
    });
  });
});
