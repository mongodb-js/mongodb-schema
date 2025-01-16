import { Schema as InternalSchema } from './schema-analyzer';
import { ExtendedJSONSchema, MongodbJSONSchema, StandardJSONSchema } from './types';

function internalSchemaToStandard(
  internalSchema: InternalSchema,
  options: {
    signal?: AbortSignal
}): StandardJSONSchema {
  // TODO: COMPASS-8700
  return {};
}

function internalSchemaToMongodb(
  internalSchema: InternalSchema,
  options: {
    signal?: AbortSignal
}): MongodbJSONSchema {
  // TODO: COMPASS-8701
  return {} as MongodbJSONSchema;
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
  internalSchemaToMongodb,
  internalSchemaToExtended
};
