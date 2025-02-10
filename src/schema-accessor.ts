import { Schema as InternalSchema } from './schema-analyzer';
import { convertors } from './schema-convertors';
import { ExpandedJSONSchema, MongoDBJSONSchema, StandardJSONSchema } from './types';

type Options = {
  signal?: AbortSignal;
}

export interface SchemaAccessor {
  getStandardJsonSchema: (options?: Options) => Promise<StandardJSONSchema>;
  getMongoDBJsonSchema: (options?: Options) => Promise<MongoDBJSONSchema>;
  getExpandedJSONSchema: (options?: Options) => Promise<ExpandedJSONSchema>;
  getInternalSchema: (options?: Options) => Promise<InternalSchema>;
}

/**
 * Accessor for different schema formats.
 * Internal schema is provided at initialization,
 * the others are converted lazily and memoized.
 * Conversion can be aborted.
 */
export class InternalSchemaBasedAccessor implements SchemaAccessor {
  private internalSchema: InternalSchema;
  private standardJSONSchema?: StandardJSONSchema;
  private mongodbJSONSchema?: MongoDBJSONSchema;
  private ExpandedJSONSchema?: ExpandedJSONSchema;

  constructor(internalSchema: InternalSchema) {
    this.internalSchema = internalSchema;
  }

  async getInternalSchema(): Promise<InternalSchema> {
    return this.internalSchema;
  }

  /**
   * Get standard JSON Schema - as per
   * https://json-schema.org/draft/2020-12/schema
   */
  async getStandardJsonSchema(options: Options = {}): Promise<StandardJSONSchema> {
    return this.standardJSONSchema ??= await convertors.internalSchemaToStandard(this.internalSchema, options);
  }

  /**
   * Get MongoDB's $jsonSchema
   */
  async getMongoDBJsonSchema(options: Options = {}): Promise<MongoDBJSONSchema> {
    return this.mongodbJSONSchema ??= await convertors.internalSchemaToMongoDB(this.internalSchema, options);
  }

  /**
   * Get expanded JSON Schema - with additional properties
   */
  async getExpandedJSONSchema(options: Options = {}): Promise<ExpandedJSONSchema> {
    return this.ExpandedJSONSchema ??= await convertors.internalSchemaToExpanded(this.internalSchema, options);
  }
}
