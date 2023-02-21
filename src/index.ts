import type { AggregationCursor, Document, FindCursor } from 'mongodb';
import { pipeline as callbackPipeline, Readable, PassThrough } from 'stream';
import { promisify } from 'util';

import stream from './stream';
import type { SchemaParseOptions, Schema, SchemaField } from './stream';
import * as schemaStats from './stats';

type MongoDBCursor = AggregationCursor | FindCursor;

/**
 * Convenience shortcut for parsing schemas. Accepts an array, stream or
 * MongoDB cursor object to parse documents` from.
 */
async function parseSchema(
  docs: Document[] | MongoDBCursor | Readable,
  options?: SchemaParseOptions
): Promise<Schema> {
  // Shift parameters if no options are specified.
  if (typeof options === 'undefined') {
    options = {};
  }

  let src: Readable;
  // MongoDB Cursors
  if ('stream' in docs) {
    src = docs.stream();
    // Streams
  } else if ('pipe' in docs) {
    src = docs;
    // Arrays
  } else if (Array.isArray(docs)) {
    src = Readable.from(docs);
  } else {
    throw new Error(
      'Unknown input type for `docs`. Must be an array, ' +
        'stream or MongoDB Cursor.'
    );
  }

  const dest = new PassThrough({ objectMode: true });
  const pipeline = promisify(callbackPipeline);
  await pipeline(src, stream(options), dest);
  for await (const result of dest) {
    return result;
  }
  throw new Error('unreachable'); // `dest` always emits one doc.
}

export default parseSchema;

export type { Schema, SchemaField };

export {
  stream,
  schemaStats
};
