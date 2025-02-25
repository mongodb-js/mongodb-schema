/**
 * Transforms the internal schema to $jsonSchema
 */
import { ArraySchemaType, DocumentSchemaType, Schema as InternalSchema, SchemaType } from '../schema-analyzer';
import { MongoDBJSONSchema } from '../types';
import { allowAbort } from '../util';

export const InternalTypeToBsonTypeMap: Record<
  SchemaType['name'] | 'Double' | 'BSONSymbol',
  string
> = {
  Double: 'double',
  Number: 'double',
  String: 'string',
  Document: 'object',
  Array: 'array',
  Binary: 'binData',
  Undefined: 'undefined',
  ObjectId: 'objectId',
  Boolean: 'bool',
  Date: 'date',
  Null: 'null',
  RegExp: 'regex',
  BSONRegExp: 'regex',
  DBRef: 'dbPointer',
  BSONSymbol: 'symbol',
  Symbol: 'symbol',
  Code: 'javascript',
  CodeWScope: 'javascriptWithScope',
  Int32: 'int',
  Timestamp: 'timestamp',
  Long: 'long',
  Decimal128: 'decimal',
  MinKey: 'minKey',
  MaxKey: 'maxKey'
};

const convertInternalType = (type: string) => {
  const bsonType = InternalTypeToBsonTypeMap[type];
  if (!bsonType) throw new Error(`Encountered unknown type: ${type}`);
  return bsonType;
};

async function parseType(type: SchemaType, signal?: AbortSignal): Promise<MongoDBJSONSchema> {
  await allowAbort(signal);
  const schema: MongoDBJSONSchema = {
    bsonType: convertInternalType(type.bsonType)
  };
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

function isPlainTypesOnly(types: MongoDBJSONSchema[]): types is { bsonType: string }[] {
  return types.every(definition => !!definition.bsonType && Object.keys(definition).length === 1);
}

async function parseTypes(types: SchemaType[], signal?: AbortSignal): Promise<MongoDBJSONSchema> {
  await allowAbort(signal);
  const definedTypes = types.filter(type => type.bsonType.toLowerCase() !== 'undefined');
  const isSingleType = definedTypes.length === 1;
  if (isSingleType) {
    return parseType(definedTypes[0], signal);
  }
  const parsedTypes = await Promise.all(definedTypes.map(type => parseType(type, signal)));
  if (isPlainTypesOnly(parsedTypes)) {
    return {
      bsonType: parsedTypes.map(({ bsonType }) => bsonType)
    };
  }
  return {
    anyOf: parsedTypes
  };
}

async function parseFields(fields: DocumentSchemaType['fields'], signal?: AbortSignal): Promise<{
  required: MongoDBJSONSchema['required'],
  properties: MongoDBJSONSchema['properties'],
}> {
  const required = [];
  const properties: MongoDBJSONSchema['properties'] = {};
  for (const field of fields) {
    if (field.probability === 1) required.push(field.name);
    properties[field.name] = await parseTypes(field.types, signal);
  }

  return { required, properties };
}

export async function convertInternalToMongodb(
  internalSchema: InternalSchema,
  options: {
    signal?: AbortSignal
} = {}): Promise<MongoDBJSONSchema> {
  const { required, properties } = await parseFields(internalSchema.fields, options.signal);
  const schema: MongoDBJSONSchema = {
    bsonType: 'object',
    required,
    properties
  };
  return schema;
}
