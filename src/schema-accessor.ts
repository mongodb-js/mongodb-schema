import { Schema as InternalSchema } from './schema-analyzer';
import { ExpandedJSONSchema, MongoDBJSONSchema, SchemaConverterFn, StandardJSONSchema } from './types';

export interface SchemaAccessor {
  getStandardJsonSchema: () => Promise<StandardJSONSchema>;
  getMongoDBJsonSchema: () => Promise<MongoDBJSONSchema>;
  getExpandedJSONSchema: () => Promise<ExpandedJSONSchema>;
  getInternalSchema: () => Promise<InternalSchema>;
}

type Options = {
  signal?: AbortSignal;
}

/**
 * Accessor for different schema formats.
 * Internal schema is provided at initialization,
 * the others are converted lazily and memoized.
 * Conversion can be aborted.
 */

export type InternalConverters = {
  internalToStandard: SchemaConverterFn<InternalSchema, StandardJSONSchema>,
  internalToExpanded: SchemaConverterFn<InternalSchema, ExpandedJSONSchema>,
  internalToMongoDB: SchemaConverterFn<InternalSchema, MongoDBJSONSchema>,
}
export class InternalSchemaBasedAccessor implements SchemaAccessor {
  private internalSchema: InternalSchema;
  private standardJSONSchema?: StandardJSONSchema;
  private mongodbJSONSchema?: MongoDBJSONSchema;
  private expandedJSONSchema?: ExpandedJSONSchema;
  private converters: InternalConverters;

  constructor(internalSchema: InternalSchema, converters: InternalConverters) {
    this.internalSchema = internalSchema;
    this.converters = converters;
  }

  async getInternalSchema(): Promise<InternalSchema> {
    return this.internalSchema;
  }

  /**
   * Get standard JSON Schema - as per
   * https://json-schema.org/draft/2020-12/schema
   */
  async getStandardJsonSchema(options: Options = {}): Promise<StandardJSONSchema> {
    return this.standardJSONSchema ??= await this.converters.internalToStandard(this.internalSchema, options);
  }

  /**
   * Get MongoDB's $jsonSchema
   */
  async getMongoDBJsonSchema(options: Options = {}): Promise<MongoDBJSONSchema> {
    return this.mongodbJSONSchema ??= await this.converters.internalToMongoDB(this.internalSchema, options);
  }

  /**
   * Get expanded JSON Schema - with additional properties
   */
  async getExpandedJSONSchema(options: Options = {}): Promise<ExpandedJSONSchema> {
    return this.expandedJSONSchema ??= await this.converters.internalToExpanded(this.internalSchema, options);
  }
}
