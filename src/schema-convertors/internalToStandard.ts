import { InternalSchema } from '..';
import { StandardJSONSchema } from '../types';

export default function internalSchemaToStandard(
  /* eslint @typescript-eslint/no-unused-vars: 0 */
  internalSchema: InternalSchema,
  options: {
    signal?: AbortSignal
}): Promise<StandardJSONSchema> {
  // TODO: COMPASS-8700
  return Promise.resolve({} as StandardJSONSchema);
}
