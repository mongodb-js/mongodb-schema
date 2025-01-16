import { Schema as InternalSchema } from './schema-analyzer';
import { ExtendedJSONSchema, MongodbJSONSchema, StandardJSONSchema } from './types';

export function internalSchemaToStandard(
  internalSchema: InternalSchema,
  options: {
    signal?: AbortSignal
}): StandardJSONSchema {
  // TODO: COMPASS-8700
  return {};
}

export function internalSchemaToMongodb(
  internalSchema: InternalSchema,
  options: {
    signal?: AbortSignal
}): MongodbJSONSchema {
  // TODO: COMPASS-8701
  return {} as MongodbJSONSchema;
}

export function internalSchemaToExtended(
  internalSchema: InternalSchema,
  options: {
    signal?: AbortSignal
}): ExtendedJSONSchema {
  // TODO: COMPASS-8702
  return {} as ExtendedJSONSchema;
}
