import assert from 'assert';

import getSchema from '../src';
import type { Schema, DocumentSchemaType } from '../src/schema-analyzer';

describe('nested document path', function() {
  let schema: Schema;
  const docs = [
    {
      foo: {
        bar: {
          baz: 1
        },
        'bar.with.dot': {
          bah: 2
        }
      }
    }
  ];

  before(async function() {
    schema = await getSchema(docs);
  });

  it('should assemble the path correctly fields with dots in their names', function() {
    const foo = schema.fields.find(v => v.name === 'foo');
    const bar = (foo?.types.find(v => v.name === 'Document') as DocumentSchemaType)?.fields.find(v => v.name === 'bar');
    const baz = (bar?.types.find(v => v.name === 'Document') as DocumentSchemaType)?.fields.find(v => v.name === 'baz');
    assert.ok(foo);
    assert.ok(bar);
    assert.ok(baz);
    assert.deepEqual(baz.path, ['foo', 'bar', 'baz']);

    const barWithDot = (foo.types.find(v => v.name === 'Document') as DocumentSchemaType)?.fields.find(v => v.name === 'bar.with.dot');
    assert.ok(barWithDot);
    const bah = (barWithDot.types.find(v => v.name === 'Document') as DocumentSchemaType)?.fields.find(v => v.name === 'bah');
    assert.ok(bah);
    assert.deepEqual(barWithDot.path, ['foo', 'bar.with.dot']);
    assert.deepEqual(bah.path, ['foo', 'bar.with.dot', 'bah']);
  });
});
