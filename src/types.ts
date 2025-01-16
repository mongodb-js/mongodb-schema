import { JSONSchema4 } from 'json-schema';

export type StandardJSONSchema = JSONSchema4;

export type MongodbJSONSchema = Pick<StandardJSONSchema, 'title' | 'required' | 'description'> & {
  bsonType: string;
  properties?: Record<string, MongodbJSONSchema>;
  items?: MongodbJSONSchema[];
  anyOf?: MongodbJSONSchema[];
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
