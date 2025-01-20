import internalSchemaToMongoDB from './internalToMongodb';
import { Schema as InternalSchema } from '../schema-analyzer';
import { ExtendedJSONSchema, StandardJSONSchema } from '../types';

function internalSchemaToStandard(
  internalSchema: InternalSchema,
  options: {
    signal?: AbortSignal
}): StandardJSONSchema {
  // TODO: COMPASS-8700
  return {} as StandardJSONSchema;
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
