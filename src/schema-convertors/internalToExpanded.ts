import { InternalSchema } from '..';
import { ExpandedJSONSchema } from '../types';

export default function internalSchemaToExpanded(
  /* eslint @typescript-eslint/no-unused-vars: 0 */
  internalSchema: InternalSchema,
  options: {
    signal?: AbortSignal
}): Promise<ExpandedJSONSchema> {
  // TODO: COMPASS-8702
  return Promise.resolve({} as ExpandedJSONSchema);
}
