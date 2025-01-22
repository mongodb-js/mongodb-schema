import { InternalSchema } from '..';
import { StandardJSONSchema } from '../types';

export default function internalSchemaToStandard(
  internalSchema: InternalSchema,
  options: {
    signal?: AbortSignal
}): StandardJSONSchema {
  // TODO: COMPASS-8700
  return {} as StandardJSONSchema;
}
