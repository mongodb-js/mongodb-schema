import type { AggregationCursor, Document, FindCursor } from 'mongodb';
import { pipeline as callbackPipeline, Readable, PassThrough } from 'stream';
import { promisify } from 'util';

import stream from './stream';
import { SchemaAnalyzer } from './schema-analyzer';
import type { SchemaParseOptions, Schema, SchemaField } from './schema-analyzer';
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
  if ('stream' in docs) {
    // MongoDB Cursor.
    src = docs.stream();
  } else if ('pipe' in docs) {
    // Document stream.
    src = docs;
  } else if (Array.isArray(docs)) {
    // Array of documents.
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
  SchemaAnalyzer,
  schemaStats
};
