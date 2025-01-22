import { type JSONSchema4 } from 'json-schema';

export type StandardJSONSchema = JSONSchema4;

export type MongoDBJSONSchema = Pick<StandardJSONSchema, 'title' | 'required' | 'description'> & {
  bsonType?: string | string[];
  properties?: Record<string, MongoDBJSONSchema>;
  items?: MongoDBJSONSchema | MongoDBJSONSchema[];
  anyOf?: MongoDBJSONSchema[];
}

export type ExtendedJSONSchema = StandardJSONSchema & {
  ['x-bsonType']: string;
  ['x-metadata']: {
    hasDuplicates: boolean;
    probability: number;
    count: number;
  };
  ['x-sampleValues']: any[];
}

export type AnyIterable<T = any> = Iterable<T> | AsyncIterable<T>;
