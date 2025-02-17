import { ArraySchemaType, DocumentSchemaType, Schema as InternalSchema, SchemaType, SchemaField } from '../schema-analyzer';
import { type ExpandedJSONSchema } from '../types';
import { InternalTypeToStandardTypeMap, RELAXED_EJSON_DEFINITIONS } from './internalToStandard';
import { InternalTypeToBsonTypeMap } from './internalToMongoDB';
import { allowAbort } from './util';

const createConvertInternalToExpanded = function() {
  const usedDefinitions = new Set<string>();

  function clearUsedDefinitions() {
    usedDefinitions.clear();
  }

  function getUsedDefinitions() {
    const filteredDefinitions = Object.fromEntries(
      Object.entries(RELAXED_EJSON_DEFINITIONS).filter(([key]) => usedDefinitions.has(key))
    );
    return Object.freeze(filteredDefinitions);
  }

  function markUsedDefinition(ref: string) {
    usedDefinitions.add(ref.split('/')[2]);
  }

  function getStandardType(internalType: string) {
    const type = InternalTypeToStandardTypeMap[internalType];
    if (!type) throw new Error(`Encountered unknown type: ${internalType}`);
    return { ...type };
  }

  function getBsonType(internalType: string) {
    const type = InternalTypeToBsonTypeMap[internalType];
    if (!type) throw new Error(`Encountered unknown type: ${internalType}`);
    return type;
  }

  async function parseType(type: SchemaType, signal?: AbortSignal): Promise<ExpandedJSONSchema> {
    await allowAbort(signal);
    const schema: ExpandedJSONSchema = {
      ...getStandardType(type.bsonType),
      'x-bsonType': getBsonType(type.bsonType),
      'x-metadata': getMetadata(type)
    };
    if ('values' in type && type.values) {
      schema['x-sampleValues'] = type.values;
    }
    if (schema.$ref) markUsedDefinition(schema.$ref);
    switch (type.bsonType) {
      case 'Array':
        schema.items = await parseTypes((type as ArraySchemaType).types, signal);
        break;
      case 'Document':
        Object.assign(schema, await parseFields((type as DocumentSchemaType).fields, signal));
        break;
    }
    return schema;
  }

  function getMetadata<TType extends SchemaField | SchemaType>({
    hasDuplicates,
    probability,
    count
  }: TType) {
    return {
      ...(typeof hasDuplicates === 'boolean' ? { hasDuplicates } : {}),
      probability,
      count
    };
  }

  async function parseTypes(types: SchemaType[], signal?: AbortSignal): Promise<ExpandedJSONSchema> {
    await allowAbort(signal);
    const definedTypes = types.filter(type => type.bsonType.toLowerCase() !== 'undefined');
    const isSingleType = definedTypes.length === 1;
    if (isSingleType) {
      return parseType(definedTypes[0], signal);
    }
    const parsedTypes = await Promise.all(definedTypes.map(type => parseType(type, signal)));
    return {
      anyOf: parsedTypes
    };
  }

  async function parseFields(
    fields: DocumentSchemaType['fields'],
    signal?: AbortSignal
  ): Promise<{ required: ExpandedJSONSchema['required']; properties: ExpandedJSONSchema['properties'] }> {
    const required = [];
    const properties: ExpandedJSONSchema['properties'] = {};
    for (const field of fields) {
      if (field.probability === 1) required.push(field.name);
      properties[field.name] = {
        ...await parseTypes(field.types, signal),
        'x-metadata': getMetadata(field)
      };
    }

    return { required, properties };
  }

  return async function convert(
    internalSchema: InternalSchema,
    options: { signal?: AbortSignal } = {}
  ): Promise<ExpandedJSONSchema> {
    clearUsedDefinitions();
    const { required, properties } = await parseFields(internalSchema.fields, options.signal);
    const schema: ExpandedJSONSchema = {
      type: 'object',
      'x-bsonType': 'object',
      required,
      properties,
      $defs: getUsedDefinitions()
    };
    return schema;
  };
};

export function convertInternalToExpanded(
  internalSchema: InternalSchema,
  options: { signal?: AbortSignal } = {}
): Promise<ExpandedJSONSchema> {
  return createConvertInternalToExpanded()(internalSchema, options);
}
