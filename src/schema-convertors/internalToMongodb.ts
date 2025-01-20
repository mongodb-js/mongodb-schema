import { ArraySchemaType, DocumentSchemaType, Schema as InternalSchema, SchemaType } from '../schema-analyzer';
import { MongodbJSONSchema } from '../types';

const internalTypeToBsonType = (type: string) => type === 'Document' ? 'object' : type.toLowerCase();

function parseType(type: SchemaType, signal?: AbortSignal): MongodbJSONSchema {
  if (signal?.aborted) throw new Error('Operation aborted');
  const schema: MongodbJSONSchema = {
    bsonType: internalTypeToBsonType(type.bsonType)
  };
  switch (type.bsonType) {
    case 'Array':
      schema.items = parseTypes((type as ArraySchemaType).types);
      break;
    case 'Document':
      Object.assign(schema,
        parseFields((type as DocumentSchemaType).fields, signal)
      );
      break;
  }

  return schema;
}

function parseTypes(types: SchemaType[], signal?: AbortSignal): MongodbJSONSchema {
  if (signal?.aborted) throw new Error('Operation aborted');
  const definedTypes = types.filter(type => type.bsonType.toLowerCase() !== 'undefined');
  const isSingleType = definedTypes.length === 1;
  if (isSingleType) {
    return parseType(definedTypes[0], signal);
  }
  const parsedTypes = definedTypes.map(type => parseType(type, signal));
  if (definedTypes.some(type => ['Document', 'Array'].includes(type.bsonType))) {
    return {
      anyOf: parsedTypes
    };
  }
  return {
    bsonType: definedTypes.map((type) => type.bsonType)
  };
}

function parseFields(fields: DocumentSchemaType['fields'], signal?: AbortSignal): {
  required: MongodbJSONSchema['required'],
  properties: MongodbJSONSchema['properties'],
} {
  const required = [];
  const properties: MongodbJSONSchema['properties'] = {};
  for (const field of fields) {
    if (signal?.aborted) throw new Error('Operation aborted');
    if (field.probability === 1) required.push(field.name);
    properties[field.name] = parseTypes(field.types, signal);
  }

  return { required, properties };
}

export default function internalSchemaToMongodb(
  internalSchema: InternalSchema,
  options: {
    signal?: AbortSignal
} = {}): MongodbJSONSchema {
  const schema: MongodbJSONSchema = {
    bsonType: 'object',
    ...parseFields(internalSchema.fields, options.signal)
  };
  return schema;
}
