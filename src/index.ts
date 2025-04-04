import { InternalSchemaBasedAccessor, SchemaAccessor } from './schema-accessor';
import { getCompletedSchemaAnalyzer, SchemaAnalyzer } from './schema-analyzer';
import type {
  ArraySchemaType,
  BaseSchemaType,
  ConstantSchemaType,
  DocumentSchemaType,
  PrimitiveSchemaType,
  SchemaType,
  Schema as InternalSchema,
  SchemaField,
  SchemaParseOptions,
  SimplifiedSchemaBaseType,
  SimplifiedSchemaArrayType,
  SimplifiedSchemaDocumentType,
  SimplifiedSchemaType,
  SimplifiedSchemaField,
  SimplifiedSchema
} from './schema-analyzer';
import { convertInternalToExpanded } from './schema-converters/internalToExpanded';
import { convertInternalToMongodb } from './schema-converters/internalToMongoDB';
import { convertInternalToStandard } from './schema-converters/internalToStandard';
import * as schemaStats from './stats';
import { AnyIterable, StandardJSONSchema, MongoDBJSONSchema, ExpandedJSONSchema, JSONSchema } from './types';
import { toTypescriptTypeDefinition } from './to-typescript';

/**
 * Analyze documents - schema can be retrieved in different formats.
 */
async function analyzeDocuments(
  source: AnyIterable,
  options?: SchemaParseOptions
): Promise<SchemaAccessor> {
  const internalSchema = (await getCompletedSchemaAnalyzer(source, options)).getResult();
  return new InternalSchemaBasedAccessor(internalSchema, {
    internalToStandard: convertInternalToStandard,
    internalToMongoDB: convertInternalToMongodb,
    internalToExpanded: convertInternalToExpanded
  });
}

/**
 * Convenience shortcut for parsing schemas. Accepts an array, stream or
 * MongoDB cursor object to parse documents` from.
 */
async function parseSchema(
  source: AnyIterable,
  options?: Partial<SchemaParseOptions>
): Promise<InternalSchema> {
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
  InternalSchema as Schema,
  InternalSchema,
  SchemaField,
  SchemaParseOptions,
  SimplifiedSchemaBaseType,
  SimplifiedSchemaArrayType,
  SimplifiedSchemaDocumentType,
  SimplifiedSchemaType,
  SimplifiedSchemaField,
  SimplifiedSchema,
  StandardJSONSchema,
  MongoDBJSONSchema,
  ExpandedJSONSchema,
  JSONSchema,
  SchemaAccessor
};

export {
  parseSchema,
  analyzeDocuments,
  getSchemaPaths,
  getSimplifiedSchema,
  SchemaAnalyzer,
  schemaStats,
  toTypescriptTypeDefinition
};
