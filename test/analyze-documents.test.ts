import { analyzeDocuments } from '../src';
import { convertors } from '../src/schema-convertors';
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
    const convertSpy = sinon.spy(convertors, 'internalSchemaToExpanded');
    const analyzeResults = await analyzeDocuments(docs);
    await analyzeResults.getExpandedJSONSchema();
    await analyzeResults.getExpandedJSONSchema();
    await analyzeResults.getExpandedJSONSchema();
    assert.strictEqual(convertSpy.calledOnce, true);
  });
});
