import { type JSONSchema4 } from 'json-schema';

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

export type AnyIterable<T = any> = Iterable<T> | AsyncIterable<T>;
