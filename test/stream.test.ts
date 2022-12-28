import es from 'event-stream';
import assert from 'assert';

import nativeParser from '../src/stream';
import type { Schema } from '../src/stream';

const fixture = [
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
  let progress = 0;
  it('should trigger progress event for each document', function(done) {
    const native = nativeParser();
    es.readArray(fixture).pipe(native)
      .on('progress', function() {
        progress += 1;
      })
      .on('data', function(schema: Schema) {
        assert.ok(schema);
        assert.equal(progress, 3);
      })
      .on('end', function() {
        done();
      });
  });
});
