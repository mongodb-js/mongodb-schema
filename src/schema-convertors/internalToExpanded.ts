import { ArraySchemaType, DocumentSchemaType, Schema as InternalSchema, SchemaType, SchemaField } from '../schema-analyzer';
import { type ExpandedJSONSchema } from '../types';
import { InternalTypeToStandardTypeMap, RELAXED_EJSON_DEFINITIONS } from './internalToStandard';
import { InternalTypeToBsonTypeMap } from './internalToMongoDB';
import { allowAbort } from './util';

const getStandardType = (internalType: string) => {
  const type = { ...InternalTypeToStandardTypeMap[internalType] };
  if (!type) throw new Error(`Encountered unknown type: ${internalType}`);
  return type;
};

const getBsonType = (internalType: string) => {
  const type = InternalTypeToBsonTypeMap[internalType];
  if (!type) throw new Error(`Encountered unknown type: ${internalType}`);
  return type;
};

async function parseType(type: SchemaType, signal?: AbortSignal): Promise<ExpandedJSONSchema> {
  await allowAbort(signal);
  const schema: ExpandedJSONSchema = {
    ...getStandardType(type.bsonType),
    'x-bsonType': getBsonType(type.bsonType),
    'x-metadata': getMetadata(type)
  };
  if ('values' in type && !!type.values) {
    schema['x-sampleValues'] = type.values;
  }
  switch (type.bsonType) {
    case 'Array':
      schema.items = await parseTypes((type as ArraySchemaType).types);
      break;
    case 'Document':
      Object.assign(schema,
        await parseFields((type as DocumentSchemaType).fields, signal)
      );
      break;
  }

  return schema;
}

const getMetadata = <TType extends SchemaField | SchemaType>({
  hasDuplicates,
  probability,
  count
}: TType) => ({
    ...(typeof hasDuplicates === 'boolean' ? { hasDuplicates } : {}),
    probability,
    count
  });

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

async function parseFields(fields: DocumentSchemaType['fields'], signal?: AbortSignal): Promise<{
  required: ExpandedJSONSchema['required'],
  properties: ExpandedJSONSchema['properties'],
}> {
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

export default async function internalSchemaToMongodb(
  internalSchema: InternalSchema,
  options: {
    signal?: AbortSignal
} = {}): Promise<ExpandedJSONSchema> {
  const { required, properties } = await parseFields(internalSchema.fields, options.signal);
  const schema: ExpandedJSONSchema = {
    type: 'object',
    'x-bsonType': 'object',
    required,
    properties,
    $defs: RELAXED_EJSON_DEFINITIONS
  };
  return schema;
}
