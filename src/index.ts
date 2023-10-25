import type { AggregationCursor, Document, FindCursor } from 'mongodb';
import { Readable, PassThrough } from 'stream';
import { pipeline } from 'stream/promises';

import stream from './stream';
import type { ParseStreamOptions } from './stream';
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
  SchemaParseOptions,
  SimplifiedSchemaBaseType,
  SimplifiedSchemaArrayType,
  SimplifiedSchemaDocumentType,
  SimplifiedSchemaType,
  SimplifiedSchemaField,
  SimplifiedSchema
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

async function schemaStream(
  source: Document[] | MongoDBCursor | Readable,
  options?: ParseStreamOptions
) {
  const streamSource = getStreamSource(source);

  const dest = new PassThrough({ objectMode: true });
  await pipeline(streamSource, stream(options), dest);
  for await (const result of dest) {
    return result;
  }
  throw new Error('unreachable'); // `dest` always emits exactly one doc.
}

/**
 * Convenience shortcut for parsing schemas. Accepts an array, stream or
 * MongoDB cursor object to parse documents` from.
 */
async function parseSchema(
  source: Document[] | MongoDBCursor | Readable,
  options?: SchemaParseOptions
): Promise<Schema> {
  return await schemaStream(source, options);
}

// Convenience shortcut for getting schema paths.
async function getSchemaPaths(
  source: Document[] | MongoDBCursor | Readable
): Promise<string[][]> {
  return await schemaStream(source, {
    schemaPaths: true
  });
}

// Convenience shortcut for getting the simplified schema.
async function getSimplifiedSchema(
  source: Document[] | MongoDBCursor | Readable
): Promise<SimplifiedSchema> {
  return await schemaStream(source, {
    simplifiedSchema: true
  });
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
  SchemaParseOptions,
  SimplifiedSchemaBaseType,
  SimplifiedSchemaArrayType,
  SimplifiedSchemaDocumentType,
  SimplifiedSchemaType,
  SimplifiedSchemaField,
  SimplifiedSchema
};

export {
  stream,
  getStreamSource,
  parseSchema,
  getSchemaPaths,
  getSimplifiedSchema,
  SchemaAnalyzer,
  schemaStats
};
