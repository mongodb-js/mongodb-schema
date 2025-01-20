import { Schema as InternalSchema } from './schema-analyzer';
import { ExtendedJSONSchema, MongoDBJSONSchema, StandardJSONSchema } from './types';

function internalSchemaToStandard(
  internalSchema: InternalSchema,
  options: {
    signal?: AbortSignal
}): StandardJSONSchema {
  // TODO: COMPASS-8700
  return {};
}

function internalSchemaToMongoDB(
  internalSchema: InternalSchema,
  options: {
    signal?: AbortSignal
}): MongoDBJSONSchema {
  // TODO: COMPASS-8701
  return {} as MongoDBJSONSchema;
}

function internalSchemaToExtended(
  internalSchema: InternalSchema,
  options: {
    signal?: AbortSignal
}): ExtendedJSONSchema {
  // TODO: COMPASS-8702
  return {} as ExtendedJSONSchema;
}

export default {
  internalSchemaToStandard,
  internalSchemaToMongoDB,
  internalSchemaToExtended
};
