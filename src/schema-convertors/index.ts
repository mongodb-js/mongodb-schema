import internalSchemaToExpanded from './internalToExpanded';
import internalSchemaToMongoDB from './internalToMongoDB';
import internalSchemaToStandard from './internalToStandard';

export const convertors = {
  internalSchemaToStandard,
  internalSchemaToMongoDB,
  internalSchemaToExpanded
};
