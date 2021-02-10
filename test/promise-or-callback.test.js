var getSchema = require('../');
var assert = require('assert');

describe('getSchema should return promise', function() {
  var docs = [
    { foo: 'bar'},
    { country: 'Croatia'},
    { country: 'Croatia'},
    { country: 'England'},
  ];

  it('Check if return value is a promise', () => {
    var result = getSchema(docs);
    assert.strictEqual(result instanceof Promise, true);
  });

  it('Check that promise returns expected schema', async() => {
    const result = await getSchema(docs);
    const fieldNames = result.fields.map(v => v.name);
    assert.deepStrictEqual(fieldNames, ['country', 'foo']);
  });

  describe('Check callback and promise return the same thing; success', () => {
    let promiseResponse;
    let callbackResponse;

    before((done) => {
      getSchema(docs).then((result) => {
        promiseResponse = result;
      });
      getSchema(docs, (err, callbackResult) => {
        if (err) {
          throw err;
        }
        callbackResponse = callbackResult;
        done();
      });
    });

    it('Using callback and promise should return the same thing', () => {
      assert.equal(promiseResponse.count, 4);
      assert.equal(callbackResponse.count, 4);
      assert.equal(promiseResponse.fields.length, 2);
      assert.equal(callbackResponse.fields.length, 2);
    });
  });

  describe('Check callback and promise return the same thing; failure', () => {
    let promiseErrMessage;
    let callbackErrMessage;

    before((done) => {
      getSchema({foo: 'bar'}, (err) => {
        getSchema({foo: 'bar'}).catch(error => {
          promiseErrMessage = error.message;
        });
        callbackErrMessage = err.message;
        done();
      });
    });

    it('Using callback and promise should give same err message', () => {
      assert.strictEqual(promiseErrMessage, callbackErrMessage);
    });
  });
});
