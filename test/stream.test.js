var nativeParser = require('../lib/stream');
var es = require('event-stream');
var assert = require('assert');
// var debug = require('debug')('mongodb-schema:test:native-parser');

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
  var progress = 0;
  it('should trigger progress event for each document', function(done) {
    var native = nativeParser();
    es.readArray(fixture).pipe(native)
      .on('progress', function() {
        progress += 1;
      })
      .on('data', function(schema) {
        assert.ok(schema);
        assert.equal(progress, 3);
      })
      .on('end', function() {
        done();
      });
  });
});
