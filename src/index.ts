import type { AggregationCursor, Document, FindCursor } from 'mongodb';
import { Readable, PassThrough } from 'stream';
import { pipeline } from 'stream/promises';

import stream from './stream';
import { SchemaAnalyzer } from './schema-analyzer';
import type {
  ArraySchemaType,
  BaseSchemaType,
  ConstantSchemaType,
  DocumentSchemaType,
  PrimitiveSchemaType,
  SchemaType,
  Schema,
  SchemaField,
  SchemaParseOptions
} from './schema-analyzer';
import * as schemaStats from './stats';

type MongoDBCursor = AggregationCursor | FindCursor;

function getStreamSource(
  source: Document[] | MongoDBCursor | Readable
): Readable {
  let streamSource: Readable;
  if ('stream' in source) {
    // MongoDB Cursor.
    streamSource = source.stream();
  } else if ('pipe' in source) {
    // Document stream.
    streamSource = source;
  } else if (Array.isArray(source)) {
    // Array of documents.
    streamSource = Readable.from(source);
  } else {
    throw new Error(
      'Unknown input type for `docs`. Must be an array, ' +
        'stream or MongoDB Cursor.'
    );
  }

  return streamSource;
}

/**
 * Convenience shortcut for parsing schemas. Accepts an array, stream or
 * MongoDB cursor object to parse documents` from.
 */
async function parseSchema(
  source: Document[] | MongoDBCursor | Readable,
  options?: SchemaParseOptions
): Promise<Schema> {
  // Shift parameters if no options are specified.
  if (typeof options === 'undefined') {
    options = {};
  }

  const streamSource = getStreamSource(source);

  const dest = new PassThrough({ objectMode: true });
  await pipeline(streamSource, stream(options), dest);
  for await (const result of dest) {
    return result;
  }
  throw new Error('unreachable'); // `dest` always emits one doc.
}

// Convenience shortcut for getting schema paths.
async function getSchemaPaths(
  source: Document[] | MongoDBCursor | Readable
): Promise<string[][]> {
  const streamSource = getStreamSource(source);

  const dest = new PassThrough({ objectMode: true });
  await pipeline(streamSource, stream({
    schemaPaths: true
  }), dest);
  for await (const result of dest) {
    return result;
  }
  throw new Error('unreachable'); // `dest` always emits one doc.
}

export default parseSchema;

export type {
  ArraySchemaType,
  BaseSchemaType,
  ConstantSchemaType,
  DocumentSchemaType,
  PrimitiveSchemaType,
  SchemaType,
  Schema,
  SchemaField,
  SchemaParseOptions
};

export {
  stream,
  getSchemaPaths,
  SchemaAnalyzer,
  schemaStats
};
