import { Schema as InternalSchema } from './schema-analyzer';
import { InternalToExpandedConverter } from './schema-converters/internalToExpanded';
import { InternalToMongoDBConverter } from './schema-converters/internalToMongoDB';
import { InternalToStandardConverter } from './schema-converters/internalToStandard';
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
  public internalToStandardConverter: InternalToStandardConverter;
  public internalToExpandedConverter: InternalToExpandedConverter;
  public internalToMongoDBConverter: InternalToMongoDBConverter;

  constructor(internalSchema: InternalSchema) {
    this.internalSchema = internalSchema;
    this.internalToStandardConverter = new InternalToStandardConverter();
    this.internalToExpandedConverter = new InternalToExpandedConverter();
    this.internalToMongoDBConverter = new InternalToMongoDBConverter();
  }

  async getInternalSchema(): Promise<InternalSchema> {
    return this.internalSchema;
  }

  /**
   * Get standard JSON Schema - as per
   * https://json-schema.org/draft/2020-12/schema
   */
  async getStandardJsonSchema(options: Options = {}): Promise<StandardJSONSchema> {
    return this.standardJSONSchema ??= await this.internalToStandardConverter.convert(this.internalSchema, options);
  }

  /**
   * Get MongoDB's $jsonSchema
   */
  async getMongoDBJsonSchema(options: Options = {}): Promise<MongoDBJSONSchema> {
    return this.mongodbJSONSchema ??= await this.internalToMongoDBConverter.convert(this.internalSchema, options);
  }

  /**
   * Get expanded JSON Schema - with additional properties
   */
  async getExpandedJSONSchema(options: Options = {}): Promise<ExpandedJSONSchema> {
    return this.ExpandedJSONSchema ??= await this.internalToExpandedConverter.convert(this.internalSchema, options);
  }
}
