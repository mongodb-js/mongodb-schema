import type { MongoDBJSONSchema } from './types';

function getBSONType(property: MongoDBJSONSchema): string | string[] | undefined {
  return property.bsonType || property.type;
}

function isBSONObjectProperty(property: MongoDBJSONSchema): boolean {
  return getBSONType(property) === 'object';
}

function isBSONArrayProperty(property: MongoDBJSONSchema): boolean {
  return getBSONType(property) === 'array';
}

function isBSONPrimitive(property: MongoDBJSONSchema): boolean {
  return !(isBSONArrayProperty(property) || isBSONObjectProperty(property));
}

function assertIsDefined<T>(value: T): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(`${value} is not defined`);
  }
}

function toTypeName(type: string): string {
  // JSON Schema types
  if (type === 'string') {
    return 'string';
  }
  if (type === 'number' || type === 'integer') {
    return 'number';
  }
  if (type === 'boolean') {
    return 'boolean';
  }
  if (type === 'null') {
    return 'null';
  }

  // BSON types
  // see InternalTypeToBsonTypeMap
  if (type === 'double') {
    return 'bson.Double';
  }
  if (type === 'binData') {
    return 'bson.Binary';
  }
  if (type === 'objectId') {
    return 'bson.ObjectId';
  }
  if (type === 'bool') {
    return 'boolean';
  }
  if (type === 'date') {
    return 'bson.Date';
  }
  if (type === 'regex') {
    return 'bson.BSONRegExp';
  }
  if (type === 'symbol') {
    return 'bson.BSONSymbol';
  }
  if (type === 'javascript' || type === 'javascriptWithScope') {
    return 'bson.Code';
  }
  if (type === 'int') {
    return 'bson.Int32';
  }
  if (type === 'timestamp') {
    return 'bson.Timestamp';
  }
  if (type === 'long') {
    return 'bson.Long';
  }
  if (type === 'decimal') {
    return 'bson.Decimal128';
  }
  if (type === 'minKey') {
    return 'bson.MinKey';
  }
  if (type === 'maxKey') {
    return 'bson.MaxKey';
  }
  if (type === 'dbPointer') {
    return 'bson.DBPointer';
  }
  if (type === 'undefined') {
    return 'undefined';
  }

  return 'any';
}

function uniqueTypes(property: MongoDBJSONSchema): Set<string> {
  const type = getBSONType(property);
  return new Set(Array.isArray(type) ? type.map((t) => toTypeName(t)) : [toTypeName(type ?? 'any')]);
}

function indentSpaces(indent: number) {
  const spaces = [];
  for (let i = 0; i < indent; i++) {
    spaces.push('  ');
  }
  return spaces.join('');
}

function arrayType(types: string[]) {
  assertIsDefined(types.length);

  if (types.length === 1) {
    return `${types[0]}[]`;
  }
  return `${types.join(' | ')})[]`;
}

function toTypescriptType(properties: Record<string, MongoDBJSONSchema>, indent: number): string {
  const eachFieldDefinition = Object.entries(properties).map(([propertyName, schema]) => {
    if (isBSONPrimitive(schema)) {
      return `${indentSpaces(indent)}${propertyName}?: ${[...uniqueTypes(schema)].join(' | ')}`;
    }

    if (isBSONArrayProperty(schema)) {
      assertIsDefined(schema.items);
      return `${indentSpaces(indent)}${propertyName}?: ${arrayType([...uniqueTypes(schema.items)])}`;
    }

    if (isBSONObjectProperty(schema)) {
      assertIsDefined(schema.properties);
      return `${indentSpaces(indent)}${propertyName}?: ${toTypescriptType(schema.properties, indent + 1)}`;
    }

    throw new Error('We should never get here');
  });

  return `{\n${eachFieldDefinition.join(';\n')}\n${indentSpaces(indent - 1)}}`;
}
export function toTypescriptTypeDefinition(databaseName: string, collectionName: string, schema: MongoDBJSONSchema): string {
  assertIsDefined(schema.properties);

  return `module ${databaseName} {
  type ${collectionName} = ${toTypescriptType(schema.properties, 2)};
};`;
}
