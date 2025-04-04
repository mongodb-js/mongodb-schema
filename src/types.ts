import { type JSONSchema4 } from 'json-schema';
import { InternalSchema } from '.';

export type StandardJSONSchema = JSONSchema4;

export type MongoDBJSONSchema = Pick<StandardJSONSchema, 'title' | 'required' | 'description'> & {
  bsonType?: string | string[];
  properties?: Record<string, MongoDBJSONSchema>;
  items?: MongoDBJSONSchema | MongoDBJSONSchema[];
  anyOf?: MongoDBJSONSchema[];
}

export type ExpandedJSONSchema = StandardJSONSchema & {
  ['x-bsonType']?: string | string[];
  ['x-metadata']?: {
    hasDuplicates?: boolean;
    probability: number;
    count: number;
  };
  ['x-sampleValues']?: any[];
  properties?: Record<string, ExpandedJSONSchema>;
  items?: ExpandedJSONSchema | ExpandedJSONSchema[];
  anyOf?: ExpandedJSONSchema[];
}

export type JSONSchema = Partial<JSONSchema4> & MongoDBJSONSchema;

export type AnyIterable<T = any> = Iterable<T> | AsyncIterable<T>;

type AnySchema = InternalSchema | StandardJSONSchema | MongoDBJSONSchema | ExpandedJSONSchema;
export type SchemaConverterFn<InputSchema = AnySchema, OutputSchema = AnySchema> = (
  input: InputSchema,
  options: { signal?: AbortSignal },
) => Promise<OutputSchema>;
