import { analyzeDocuments } from '../src';
import sinon from 'sinon';
import assert from 'assert';

describe('analyzeDocuments', function() {
  const docs = [{}];

  it('Converts lazily', async function() {
    const analyzeResults = await analyzeDocuments(docs);
    const convertSpy = sinon.spy((analyzeResults as any).internalToStandardConvertor, 'convert');
    assert.strictEqual(convertSpy.called, false);
    await analyzeResults.getStandardJsonSchema();
    assert.strictEqual(convertSpy.calledOnce, true);
  });

  it('Only converts the same format once', async function() {
    const analyzeResults = await analyzeDocuments(docs);
    const convertSpy = sinon.spy((analyzeResults as any).internalToExpandedConvertor, 'convert');
    await analyzeResults.getExpandedJSONSchema();
    await analyzeResults.getExpandedJSONSchema();
    await analyzeResults.getExpandedJSONSchema();
    assert.strictEqual(convertSpy.calledOnce, true);
  });
});
