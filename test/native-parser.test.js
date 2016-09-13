var nativeParser = require('../lib/parse-native');
var ampersandParser = require('../lib');
var es = require('event-stream');
var assert = require('assert');
var debug = require('debug')('mongodb-schema:test:native-parser');

var fixture = [
  {
    foo: 1,
    bar: 'test',
    arr: [1, 2, 3]
  },
  {
    foo: 2,
    baz: true,
    arr: ['foo']
  },
  {
    foo: 3,
    bar: 'another test'
  }
];

describe('native schema stream', function() {
  it('should work', function(done) {
    var native = nativeParser();
    es.readArray(fixture).pipe(native)
      .on('progress', function(doc) {
        debug('progress', doc);
      })
      .on('data', function(nativeSchema) {
        debug('native:', nativeSchema);
        ampersandParser('test.test', fixture, function(err, ampersandSchema) {
          assert.ifError(err);
          debug('ampersand:', ampersandSchema.serialize());
          assert.deepEqual(nativeSchema, ampersandSchema);
        });
      })
      .on('end', function() {
        done();
      });
  });
});
