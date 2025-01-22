import { Schema as InternalSchema } from './schema-analyzer';
import convertors from './schema-convertors';
import { ExpandedJSONSchema, MongoDBJSONSchema, StandardJSONSchema } from './types';

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
export class InternalSchemaBasedAccessor implements SchemaAccessor {
  private internalSchema: InternalSchema;
  private standardJSONSchema?: StandardJSONSchema;
  private mongodbJSONSchema?: MongoDBJSONSchema;
  private ExpandedJSONSchema?: ExpandedJSONSchema;

  constructor(internalSchema: InternalSchema) {
    this.internalSchema = internalSchema;
  }

  async getInternalSchema(options?: Options): Promise<InternalSchema> {
    return this.internalSchema;
  }

  async getStandardJsonSchema(options: Options = {}): Promise<StandardJSONSchema> {
    return this.standardJSONSchema ??= await convertors.internalSchemaToStandard(this.internalSchema, options);
  }

  async getMongoDBJsonSchema(options: Options = {}): Promise<MongoDBJSONSchema> {
    return this.mongodbJSONSchema ??= await convertors.internalSchemaToMongoDB(this.internalSchema, options);
  }

  async getExpandedJSONSchema(options: Options = {}): Promise<ExpandedJSONSchema> {
    return this.ExpandedJSONSchema ??= await convertors.internalSchemaToExpanded(this.internalSchema, options);
  }
}
