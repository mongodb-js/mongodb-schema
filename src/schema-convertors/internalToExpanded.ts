import { InternalSchema } from '..';
import { ExpandedJSONSchema } from '../types';

export default function internalSchemaToExpanded(
  internalSchema: InternalSchema,
  options: {
    signal?: AbortSignal
}): ExpandedJSONSchema {
  // TODO: COMPASS-8702
  return {} as ExpandedJSONSchema;
}
