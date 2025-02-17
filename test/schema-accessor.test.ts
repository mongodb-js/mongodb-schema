import { type InternalSchema } from '../src';
import sinon from 'sinon';
import assert from 'assert';
import { InternalConverters, InternalSchemaBasedAccessor } from '../src/schema-accessor';

describe('analyzeDocuments', function() {
  const internalSchema: InternalSchema = {
    count: 1,
    fields: []
  };
  let sandbox: sinon.SinonSandbox;
  let converters: InternalConverters;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(function() {
    converters = {
      internalToStandard: sandbox.stub(),
      internalToMongoDB: sandbox.stub(),
      internalToExpanded: sandbox.stub()
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('Converts lazily', async function() {
    const schema = new InternalSchemaBasedAccessor(internalSchema, converters as InternalConverters);
    assert.strictEqual((converters.internalToStandard as sinon.SinonStub).called, false);
    await schema.getStandardJsonSchema();
    assert.strictEqual((converters.internalToStandard as sinon.SinonStub).calledOnce, true);
  });

  it('Only converts the same format once', async function() {
    const schema = new InternalSchemaBasedAccessor(internalSchema, converters as InternalConverters);
    assert.strictEqual((converters.internalToExpanded as sinon.SinonStub).called, false);
    (converters.internalToExpanded as sinon.SinonStub).returns({ abc: 'string' });
    await schema.getExpandedJSONSchema();
    await schema.getExpandedJSONSchema();
    await schema.getExpandedJSONSchema();
    assert.strictEqual((converters.internalToExpanded as sinon.SinonStub).calledOnce, true);
  });
});
