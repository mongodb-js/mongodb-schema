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

type AnyIterable<T = any> = Iterable<T> | AsyncIterable<T>;

function verifyStreamSource(
  source: AnyIterable
): AnyIterable {
  if (!(Symbol.iterator in source) && !(Symbol.asyncIterator in source)) {
    throw new Error(
      'Unknown input type for `docs`. Must be an array, ' +
        'stream or MongoDB Cursor.'
    );
  }

  return source;
}

async function getCompletedSchemaAnalyzer(
  source: AnyIterable,
  options?: SchemaParseOptions
): Promise<SchemaAnalyzer> {
  const analyzer = new SchemaAnalyzer(options);
  for await (const doc of verifyStreamSource(source)) {
    analyzer.analyzeDoc(doc);
  }
  return analyzer;
}

/**
 * Convenience shortcut for parsing schemas. Accepts an array, stream or
 * MongoDB cursor object to parse documents` from.
 */
async function parseSchema(
  source: AnyIterable,
  options?: SchemaParseOptions
): Promise<Schema> {
  return (await getCompletedSchemaAnalyzer(source, options)).getResult();
}

// Convenience shortcut for getting schema paths.
async function getSchemaPaths(
  source: AnyIterable
): Promise<string[][]> {
  return (await getCompletedSchemaAnalyzer(source)).getSchemaPaths();
}

// Convenience shortcut for getting the simplified schema.
async function getSimplifiedSchema(
  source: AnyIterable
): Promise<SimplifiedSchema> {
  return (await getCompletedSchemaAnalyzer(source)).getSimplifiedSchema();
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
  parseSchema,
  getSchemaPaths,
  getSimplifiedSchema,
  SchemaAnalyzer,
  schemaStats
};
