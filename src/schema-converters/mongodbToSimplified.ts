/**
 * Transforms MongoDB's $jsonSchema - as set in a collection validator - to the
 * simplified schema.
 *
 * This deliberately does not go via the internal schema: that representation is
 * probabilistic (count, probability, hasDuplicates, sample values) and a
 * validator contains none of those, so populating it would mean inventing
 * statistics. The simplified schema carries types only, which a validator can
 * describe honestly.
 *
 * A validator constrains documents rather than describing them, so the mapping
 * is intentionally lossy: value-level constraints (enum, minimum, pattern, ...)
 * are ignored, as are `required`, `patternProperties` and `additionalProperties`.
 * Nothing throws - constructs that carry no type information, and malformed
 * subschemas, simply contribute nothing.
 */
import type {
  SchemaBSONType,
  SimplifiedSchema,
  SimplifiedSchemaArrayType,
  SimplifiedSchemaDocumentType,
  SimplifiedSchemaType
} from '../schema-analyzer';
import type { MongoDBJSONSchema } from '../types';

/**
 * BSON type aliases accepted by $jsonSchema's `bsonType`, mapped to the type
 * names schema inference produces. Note this is not a straight inversion of
 * `InternalTypeToBsonTypeMap`, which is many-to-one (both `Number` and `Double`
 * map to `double`, both `RegExp` and `BSONRegExp` to `regex`), so where that map
 * collapses two names we pick the BSON-wrapper one a validator would mean.
 */
export const BSONTypeAliasToSimplifiedType: Record<string, SchemaBSONType> = {
  double: 'Double',
  string: 'String',
  object: 'Document',
  array: 'Array',
  binData: 'Binary',
  undefined: 'Undefined',
  objectId: 'ObjectId',
  bool: 'Boolean',
  date: 'Date',
  null: 'Null',
  regex: 'BSONRegExp',
  javascript: 'Code',
  javascriptWithScope: 'CodeWScope',
  symbol: 'BSONSymbol',
  int: 'Int32',
  timestamp: 'Timestamp',
  long: 'Long',
  decimal: 'Decimal128',
  minKey: 'MinKey',
  maxKey: 'MaxKey',
  // The inverse of `InternalTypeToBsonTypeMap`'s `DBRef: 'dbPointer'`.
  dbPointer: 'DBRef',
  // `number` covers int/long/double/decimal. A single numeric stand-in claims
  // less than expanding it into four distinct types would.
  number: 'Double'
};

/**
 * $jsonSchema also accepts the standard JSON Schema `type` keyword, used as a
 * fallback when `bsonType` is absent.
 */
export const JSONSchemaTypeToSimplifiedType: Record<string, SchemaBSONType> = {
  object: 'Document',
  array: 'Array',
  string: 'String',
  number: 'Double',
  boolean: 'Boolean',
  null: 'Null',
  // MongoDB rejects `type: 'integer'` inside $jsonSchema, but accepting it here
  // costs nothing and makes this usable for plain JSON Schema input.
  integer: 'Int32'
};

const UNION_KEYWORDS = ['anyOf', 'oneOf', 'allOf'] as const;

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Validators are checked by the server when set, but this is also usable on
 * arbitrary input, so every subschema is checked before it is read.
 */
function isSchema(value: unknown): value is MongoDBJSONSchema {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDocumentType(type: SimplifiedSchemaType): type is SimplifiedSchemaDocumentType {
  return type.bsonType === 'Document';
}

function isArrayType(type: SimplifiedSchemaType): type is SimplifiedSchemaArrayType {
  return type.bsonType === 'Array';
}

/**
 * Adds a type to a union, merging into the existing entry if one already has
 * this bsonType. Inference emits at most one entry per bsonType per field, so
 * collapsing duplicates keeps the output shape identical to inferred schemas -
 * two `object` branches of an anyOf become one Document with merged fields.
 */
function mergeTypeInto(types: SimplifiedSchemaType[], incoming: SimplifiedSchemaType): void {
  const existing = types.find(type => type.bsonType === incoming.bsonType);
  if (!existing) {
    types.push(incoming);
    return;
  }

  if (isDocumentType(existing) && isDocumentType(incoming)) {
    mergeFieldsInto(existing.fields, incoming.fields);
  } else if (isArrayType(existing) && isArrayType(incoming)) {
    mergeTypesInto(existing.types, incoming.types);
  }
}

function mergeTypesInto(types: SimplifiedSchemaType[], incoming: SimplifiedSchemaType[]): void {
  for (const type of incoming) {
    mergeTypeInto(types, type);
  }
}

function mergeFieldsInto(fields: SimplifiedSchema, incoming: SimplifiedSchema): void {
  for (const name of Object.keys(incoming)) {
    const existing = fields[name];
    if (!existing) {
      fields[name] = incoming[name];
      continue;
    }
    mergeTypesInto(existing.types, incoming[name].types);
  }
}

function mapAliases(value: unknown, map: Record<string, SchemaBSONType>): SchemaBSONType[] {
  const types: SchemaBSONType[] = [];
  for (const key of toArray(value)) {
    // Own-property check, so that aliases like `constructor` do not resolve to
    // `Object.prototype` members.
    if (typeof key === 'string' && Object.prototype.hasOwnProperty.call(map, key)) {
      types.push(map[key]);
    }
  }
  return types;
}

/**
 * The types a subschema names outright. Unrecognised aliases contribute
 * nothing, so a `bsonType` made up only of those falls through to `type`.
 */
function explicitTypes(schema: MongoDBJSONSchema): SchemaBSONType[] {
  const bsonTypes = mapAliases(schema.bsonType, BSONTypeAliasToSimplifiedType);
  if (bsonTypes.length > 0) return bsonTypes;

  const jsonTypes = mapAliases(schema.type, JSONSchemaTypeToSimplifiedType);
  if (jsonTypes.length > 0) return jsonTypes;

  // CSFLE fields are declared with `encrypt` in place of `bsonType`. The value
  // is stored as BinData subtype 6, which is what inference would observe.
  if (isSchema(schema.encrypt)) return ['Binary'];

  return [];
}

/**
 * The types an untyped subschema's structural keywords imply. Strictly, JSON
 * Schema applies `properties` only if the value is an object, but a validator
 * author leaving out `bsonType: 'object'` almost always means one.
 */
function impliedTypes(schema: MongoDBJSONSchema): SchemaBSONType[] {
  const types: SchemaBSONType[] = [];
  if (isSchema(schema.properties) || isSchema(schema.patternProperties)) {
    types.push('Document');
  }
  if (schema.items !== undefined || isSchema(schema.additionalItems)) {
    types.push('Array');
  }
  return types;
}

/**
 * js-bson deserialises any embedded document with `$ref` and `$id` into a
 * DBRef, so that is what inference reports for a validator's DBRef shape.
 */
function resolveDBRefs(types: SimplifiedSchemaType[]): SimplifiedSchemaType[] {
  const resolved: SimplifiedSchemaType[] = [];
  for (const type of types) {
    const isDBRef = isDocumentType(type) && '$ref' in type.fields && '$id' in type.fields;
    mergeTypeInto(resolved, isDBRef ? { bsonType: 'DBRef' } : type);
  }
  return resolved;
}

function buildType(bsonType: SchemaBSONType, schema: MongoDBJSONSchema): SimplifiedSchemaType {
  if (bsonType === 'Document') {
    return { bsonType, fields: collectFields(schema.properties) };
  }

  if (bsonType === 'Array') {
    const types: SimplifiedSchemaType[] = [];
    // `additionalItems` describes the members past a tuple `items` form.
    for (const items of [...toArray(schema.items), schema.additionalItems]) {
      mergeTypesInto(types, collectTypes(items));
    }
    return { bsonType, types: resolveDBRefs(types) };
  }

  return { bsonType };
}

/**
 * The types a single subschema can describe. `anyOf`/`oneOf`/`allOf` all
 * contribute to one union - `allOf` is treated as a union rather than an
 * intersection because an intersection is not expressible in the simplified
 * schema, and a union is the conservative over-approximation.
 *
 * `scope` is the types of the enclosing schema, when this is one of its union
 * branches. An untyped branch constrains those types rather than introducing
 * its own, so `{ bsonType: 'object', oneOf: [{ properties }] }` merges the
 * branch's properties into the parent's Document, and a `properties`-only
 * branch of a `string` does not invent a Document.
 */
function collectTypes(schema: unknown, scope?: SchemaBSONType[]): SimplifiedSchemaType[] {
  if (!isSchema(schema)) return [];

  const explicit = explicitTypes(schema);
  const own = explicit.length > 0 ? explicit : (scope ?? impliedTypes(schema));

  const types: SimplifiedSchemaType[] = [];
  for (const bsonType of own) {
    mergeTypeInto(types, buildType(bsonType, schema));
  }

  const branchScope = own.length > 0 ? own : undefined;
  for (const keyword of UNION_KEYWORDS) {
    const branches = schema[keyword];
    if (!Array.isArray(branches)) continue;
    for (const branch of branches) {
      mergeTypesInto(types, collectTypes(branch, branchScope));
    }
  }

  return types;
}

function collectFields(properties: unknown): SimplifiedSchema {
  // Null prototype, matching `simplifiedSchema` in schema-analyzer, so that
  // field names like `__proto__` cannot collide with object internals.
  const fields: SimplifiedSchema = Object.create(null);
  if (!isSchema(properties)) return fields;

  const subschemas = properties as Record<string, unknown>;
  for (const name of Object.keys(subschemas)) {
    const types = resolveDBRefs(collectTypes(subschemas[name]));
    // A field with no type information is omitted rather than emitted with an
    // empty `types` array: inference cannot produce the latter, since a field
    // appears there only because a value was observed for it.
    if (types.length > 0) {
      fields[name] = { types };
    }
  }

  return fields;
}

export function convertMongoDBJSONSchemaToSimplified(
  jsonSchema: MongoDBJSONSchema
): SimplifiedSchema {
  // The root always describes a document, so it is read as one even when
  // untyped - including when its shape lives entirely in union branches.
  const root = collectTypes(jsonSchema, ['Document']).find(isDocumentType);
  return root?.fields ?? Object.create(null);
}
