import type { JSONSchema } from './types';

function getBSONType(property: JSONSchema): string | string[] | undefined {
  return property.bsonType || property.type;
}

function assertIsDefined<T>(
  value: T,
  message: string
): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(message);
  }
}

function toTypeName(type: string): string | string[] {
  switch (type) {
    // JSON Schema types
    case 'string':
      return 'string';

    case 'number':
    case 'integer':
      return 'number';

    case 'boolean':
      return 'boolean';

    case 'null':
      return 'null';

    // BSON types
    // see InternalTypeToBsonTypeMap in mongodb-schema:
    // https://github.com/mongodb-js/mongodb-schema/blob/5ca185a6967e0f0d1bb20f75555d3f4f1f9c24fe/src/schema-converters/internalToMongoDB.ts#L8
    case 'double':
      return ['bson.Double', 'number'];

    case 'binData':
      return 'bson.Binary';
    case 'objectId':
      return 'bson.ObjectId';

    case 'bool':
      return 'boolean';

    case 'date':
      return 'bson.Date';

    case 'regex':
      return 'bson.BSONRegExp';

    case 'symbol':
      return 'bson.BSONSymbol';

    case 'javascript':
    case 'javascriptWithScope':
      return 'bson.Code';

    case 'int':
      return ['bson.Int32', 'number'];

    case 'timestamp':
      return 'bson.Timestamp';

    case 'long':
      return ['bson.Long', 'number'];

    case 'decimal':
      return 'bson.Decimal128';

    case 'minKey':
      return 'bson.MinKey';

    case 'maxKey':
      return 'bson.MaxKey';

    case 'dbPointer':
      return 'bson.DBPointer';

    case 'undefined':
      return 'undefined';

    default:
      return 'any';
  }
}

function uniqueTypes(property: JSONSchema): Set<string> {
  const type = getBSONType(property);
  const types = (Array.isArray(type) ? type : [type ?? 'any'])
    .map((t) => toTypeName(t))
    .flat();
  return new Set(types.flat());
}

function indentSpaces(indent: number) {
  const spaces = [];
  for (let i = 0; i < indent; i++) {
    spaces.push('  ');
  }
  return spaces.join('');
}

function arrayType(types: string[]) {
  if (types.length === 1) {
    return `${types[0]}[]`;
  }
  return `${types.join(' | ')})[]`;
}

function toTypescriptType(
  properties: Record<string, JSONSchema>,
  indent: number
): string {
  const eachFieldDefinition = Object.entries(properties).map(
    ([propertyName, schema]) => {
      switch (getBSONType(schema)) {
        case 'array':
          assertIsDefined(schema.items, 'schema.items must be defined');
          return `${indentSpaces(indent)}${propertyName}?: ${arrayType([
            ...uniqueTypes(schema.items)
          ])}`;
        case 'object':
          assertIsDefined(
            schema.properties,
            'schema.properties must be defined'
          );
          return `${indentSpaces(indent)}${propertyName}?: ${toTypescriptType(
            schema.properties as Record<string, JSONSchema>,
            indent + 1
          )}`;
        default:
          return `${indentSpaces(indent)}${propertyName}?: ${[
            ...uniqueTypes(schema)
          ].join(' | ')}`;
      }
    }
  );

  return `{\n${eachFieldDefinition.join(';\n')};\n${indentSpaces(indent - 1)}}`;
}

export function toTypescriptTypeDefinition(schema: JSONSchema): string {
  assertIsDefined(schema.properties, 'schema.properties must be defined');

  return toTypescriptType(schema.properties as Record<string, JSONSchema>, 1);
}
