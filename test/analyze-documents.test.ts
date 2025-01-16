import { analyzeDocuments } from '../src';
import convertors from '../src/schema-convertors';
import sinon from 'sinon';
import assert from 'assert';

describe('analyzeDocuments', function() {
  const docs = [{}];

  it('Converts lazily', async function() {
    const convertSpy = sinon.spy(convertors, 'internalSchemaToStandard');
    const analyzeResults = await analyzeDocuments(docs);
    assert.strictEqual(convertSpy.called, false);
    await analyzeResults.getStandardJsonSchema();
    assert.strictEqual(convertSpy.calledOnce, true);
  });

  it('Only converts the same format once', async function() {
    const convertSpy = sinon.spy(convertors, 'internalSchemaToExtended');
    const analyzeResults = await analyzeDocuments(docs);
    await analyzeResults.getExtendedJsonSchema();
    await analyzeResults.getExtendedJsonSchema();
    await analyzeResults.getExtendedJsonSchema();
    assert.strictEqual(convertSpy.calledOnce, true);
  });
});
