import { InternalSchema } from '..';
import { StandardJSONSchema } from '../types';

export default function internalSchemaToStandard(
  /* eslint @typescript-eslint/no-unused-vars: 0 */
  internalSchema: InternalSchema,
  options: {
    signal?: AbortSignal
}): StandardJSONSchema {
  // TODO: COMPASS-8700
  return {} as StandardJSONSchema;
}
