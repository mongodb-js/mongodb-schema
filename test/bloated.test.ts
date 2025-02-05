import assert from 'assert';
import { Binary, Code } from 'bson';

import type { PrimitiveSchemaType } from '../src/schema-analyzer';
import getSchema from '../src';

function generateRandomString(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

describe('bloated documents', function() {
  it('really long string is cropped', async function() {
    const documents = [{
      str: generateRandomString(20000)
    }];
    const schema = await getSchema(documents);
    const stringLength = ((schema.fields[0].types[0] as PrimitiveSchemaType).values[0] as string).length;
    assert.ok(stringLength <= 10000);
  });

  it('really long code is cropped', async function() {
    const documents = [{
      code: new Code(generateRandomString(20000))
    }];
    const schema = await getSchema(documents);
    const codeLength = ((schema.fields[0].types[0] as PrimitiveSchemaType).values[0] as Code).code.length;
    assert.ok(codeLength <= 10000);
  });

  it('really long binary is cropped', async function() {
    const documents = [{
      binData: new Binary(Buffer.from(generateRandomString(20000)), 2)
    }];
    const schema = await getSchema(documents);
    const binary = ((schema.fields[0].types[0] as PrimitiveSchemaType).values[0] as Binary);
    assert.ok(binary.length() <= 10000);
    assert.strictEqual(binary.sub_type, 2);
  });
});
