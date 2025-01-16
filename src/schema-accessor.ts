import { Schema as InternalSchema } from './schema-analyzer';
import convertors from './schema-convertors';
import { ExtendedJSONSchema, MongodbJSONSchema, StandardJSONSchema } from './types';

export interface SchemaAccessor {
  getStandardJsonSchema: () => Promise<StandardJSONSchema>;
  getMongodbJsonSchema: () => Promise<MongodbJSONSchema>;
  getExtendedJsonSchema: () => Promise<ExtendedJSONSchema>;
  getInternalSchema: () => Promise<InternalSchema>;
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
  private mongodbJSONSchema?: MongodbJSONSchema;
  private extendedJSONSchema?: ExtendedJSONSchema;
  private signal?: AbortSignal;

  constructor(internalSchema: InternalSchema, signal?: AbortSignal) {
    this.signal = signal;
    this.internalSchema = internalSchema;
  }

  async getInternalSchema(): Promise<InternalSchema> {
    return this.internalSchema;
  }

  async getStandardJsonSchema(): Promise<StandardJSONSchema> {
    if (this.standardJSONSchema) return this.standardJSONSchema;
    return this.standardJSONSchema = await convertors.internalSchemaToStandard(this.internalSchema, { signal: this.signal });
  }

  async getMongodbJsonSchema(): Promise<MongodbJSONSchema> {
    if (this.mongodbJSONSchema) return this.mongodbJSONSchema;
    return this.mongodbJSONSchema = await convertors.internalSchemaToMongodb(this.internalSchema, { signal: this.signal });
  }

  async getExtendedJsonSchema(): Promise<ExtendedJSONSchema> {
    if (this.extendedJSONSchema) return this.extendedJSONSchema;
    return this.extendedJSONSchema = await convertors.internalSchemaToExtended(this.internalSchema, { signal: this.signal });
  }
}
