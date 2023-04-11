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
        }
      }
    }
  ];

  before(async function() {
    schema = await getSchema(docs);
  });

  it('should assemble the path correctly with dot-notation', function() {
    const foo = schema.fields.find(v => v.name === 'foo');
    const bar = (foo?.types.find(v => v.name === 'Document') as DocumentSchemaType)?.fields.find(v => v.name === 'bar');
    const baz = (bar?.types.find(v => v.name === 'Document') as DocumentSchemaType)?.fields.find(v => v.name === 'baz');
    assert.ok(foo);
    assert.ok(bar);
    assert.ok(baz);
    assert.equal(baz.path, 'foo.bar.baz');
  });
});
