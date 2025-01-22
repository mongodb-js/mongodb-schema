import { Schema as InternalSchema } from './schema-analyzer';
import convertors from './schema-convertors';
import { ExtendedJSONSchema, MongoDBJSONSchema, StandardJSONSchema } from './types';

export interface SchemaAccessor {
  getStandardJsonSchema: () => Promise<StandardJSONSchema>;
  getMongoDBJsonSchema: () => Promise<MongoDBJSONSchema>;
  getExtendedJsonSchema: () => Promise<ExtendedJSONSchema>;
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
  private extendedJSONSchema?: ExtendedJSONSchema;

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

  async getExtendedJsonSchema(options: Options = {}): Promise<ExtendedJSONSchema> {
    return this.extendedJSONSchema ??= await convertors.internalSchemaToExtended(this.internalSchema, options);
  }
}
