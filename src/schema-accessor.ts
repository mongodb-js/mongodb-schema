import { Schema as InternalSchema } from './schema-analyzer';
import InternalToExpandedConvertor from './schema-convertors/internalToExpanded';
import internalSchemaToMongodb from './schema-convertors/internalToMongoDB';
import InternalToStandardConvertor from './schema-convertors/internalToStandard';
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
  public internalToStandardConvertor: InternalToStandardConvertor;
  public internalToExpandedConvertor: InternalToExpandedConvertor;

  constructor(internalSchema: InternalSchema) {
    this.internalSchema = internalSchema;
    this.internalToStandardConvertor = new InternalToStandardConvertor();
    this.internalToExpandedConvertor = new InternalToExpandedConvertor();
  }

  async getInternalSchema(): Promise<InternalSchema> {
    return this.internalSchema;
  }

  /**
   * Get standard JSON Schema - as per
   * https://json-schema.org/draft/2020-12/schema
   */
  async getStandardJsonSchema(options: Options = {}): Promise<StandardJSONSchema> {
    return this.standardJSONSchema ??= await this.internalToStandardConvertor.convert(this.internalSchema, options);
  }

  /**
   * Get MongoDB's $jsonSchema
   */
  async getMongoDBJsonSchema(options: Options = {}): Promise<MongoDBJSONSchema> {
    return this.mongodbJSONSchema ??= await internalSchemaToMongodb(this.internalSchema, options);
  }

  /**
   * Get expanded JSON Schema - with additional properties
   */
  async getExpandedJSONSchema(options: Options = {}): Promise<ExpandedJSONSchema> {
    return this.ExpandedJSONSchema ??= await this.internalToExpandedConvertor.convert(this.internalSchema, options);
  }
}
