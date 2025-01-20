
import Reservoir from 'reservoir';
import {
  Document,
  ObjectId,
  MinKey,
  MaxKey,
  Long,
  Double,
  Int32,
  Decimal128,
  Binary,
  BSONRegExp,
  Code,
  BSONSymbol,
  Timestamp
} from 'bson';

import semanticTypes from './semantic-types';
import { AnyIterable } from './types';

type TypeCastMap = {
  Array: unknown[];
  Binary: Binary;
  Boolean: boolean;
  Code: Code;
  Date: Date;
  Decimal128: Decimal128;
  Double: Double;
  Int32: Int32;
  Int64: Long;
  MaxKey: MaxKey;
  MinKey: MinKey;
  Null: null;
  Object: Record<string, unknown>; // Note: In the resulting schema we rename `Object` to `Document`.
  ObjectId: ObjectId;
  BSONRegExp: BSONRegExp;
  String: string;
  BSONSymbol: BSONSymbol;
  Timestamp: Timestamp;
  Undefined: undefined;
};

type TypeCastTypes = keyof TypeCastMap;
type BSONValue = TypeCastMap[TypeCastTypes];

export type BaseSchemaType = {
  path: string[];
  name: string;
  count: number;
  probability: number;
  bsonType: string;

  // As `values` is from a sample reservoir this isn't a true check for duplicates/uniqueness.
  // We cannot compute `unique` and `hasDuplicates` when `storeValues` is false.
  hasDuplicates?: boolean;
  unique?: number;
}

export type ConstantSchemaType = BaseSchemaType & {
  name: 'Null' | 'Undefined';
}

export type PrimitiveSchemaType = BaseSchemaType & {
  name: 'String' | 'Number' | 'Int32' | 'Boolean' | 'Decimal128' | 'Long' | 'ObjectId' | 'Date' | 'RegExp' | 'Symbol' | 'MaxKey' | 'MinKey' | 'Binary' | 'Code' | 'Timestamp' | 'DBRef';
  values: BSONValue[];
}

export type ArraySchemaType = BaseSchemaType & {
  name: 'Array';
  lengths: number[];
  averageLength: number;
  totalCount: number;
  // eslint-disable-next-line no-use-before-define
  types: SchemaType[];
}

export type DocumentSchemaType = BaseSchemaType & {
  name: 'Document';
  // eslint-disable-next-line no-use-before-define
  fields: SchemaField[];
}

// We include the base schema type to make the `semantic-types` usage
// easier to type.
export type SchemaType = BaseSchemaType | ConstantSchemaType | PrimitiveSchemaType | ArraySchemaType | DocumentSchemaType;

export type SchemaField = {
  name: string;
  count: number;
  path: string[];
  type: string | string[];
  probability: number;
  hasDuplicates: boolean;
  types: SchemaType[];
};

export type Schema = {
  count: number;
  fields: SchemaField[]
}

type SchemaBSONType = Exclude<keyof TypeCastMap, 'Object'> | 'Document';

type SchemaAnalysisBaseType = {
  name: string;
  path: string[];
  bsonType: SchemaBSONType;
  count: number;
  values?: ReturnType<typeof Reservoir>
}

type SchemaAnalysisNullType = SchemaAnalysisBaseType & {
  name: 'Null';
}

type SchemaAnalysisPrimitiveType = SchemaAnalysisBaseType & {
  name: 'String' | 'Number' | 'Int32' | 'Boolean' | 'Decimal128' | 'Long' | 'ObjectId' | 'Date' | 'RegExp' | 'Symbol' | 'MaxKey' | 'MinKey' | 'Binary' | 'Code' | 'Timestamp' | 'DBRef';
}

type SchemaAnalysisArrayType = SchemaAnalysisBaseType & {
  name: 'Array';
  lengths: number[];
  // eslint-disable-next-line no-use-before-define
  types: SchemaAnalysisFieldTypes;
}

type SchemaAnalysisDocumentType = SchemaAnalysisBaseType & {
  name: 'Document';
  // eslint-disable-next-line no-use-before-define
  fields: SchemaAnalysisFieldsMap;
}

// We include the base schema type to make the `semantic-types` usage
// easier to type.
type SchemaAnalysisType = SchemaAnalysisBaseType | SchemaAnalysisNullType | SchemaAnalysisPrimitiveType | SchemaAnalysisArrayType | SchemaAnalysisDocumentType;

type SchemaAnalysisFieldTypes = {
  [fieldName: string]: SchemaAnalysisType
}

type SchemaAnalysisField = {
  name: string;
  path: string[];
  count: number;
  types: SchemaAnalysisFieldTypes;
}

// This is used for the current state of the schema analysis.
type SchemaAnalysisFieldsMap = {
  [fieldName: string]: SchemaAnalysisField
}

type SchemaAnalysisRoot = {
  fields: SchemaAnalysisFieldsMap;
  count: number;
}

type SemanticTypeFunction = ((value: BSONValue, path?: string[]) => boolean);
type SemanticTypeMap = {
  [typeName: string]: SemanticTypeFunction | boolean;
};

export type SchemaParseOptions = {
  semanticTypes?: boolean | SemanticTypeMap;
  storeValues?: boolean;
  signal?: AbortSignal;
};

/**
* Extracts a Javascript string from a BSON type to compute unique values.
*/
function extractStringValueFromBSON(value: any): string {
  if (value?._bsontype) {
    if (['Decimal128', 'Long'].includes(value._bsontype)) {
      return value.toString();
    }
    if (['Double', 'Int32'].includes(value._bsontype)) {
      return String(value.value);
    }
  }
  if (typeof value === 'string') {
    return value;
  }
  return String(value);
}

function fieldComparator(a: {
  name: string
}, b: {
  name: string
}) {
  // Make sure _id is always at top, even in presence of uppercase fields.
  const aName = a.name;
  const bName = b.name;
  if (aName === '_id') {
    return -1;
  }
  if (bName === '_id') {
    return 1;
  }
  // Otherwise sort case-insensitively.
  return aName.toLowerCase() < bName.toLowerCase() ? -1 : 1;
}

/**
 * Returns the type of value as a string. BSON type aware. Replaces `Object`
 * with `Document` to avoid naming conflicts with javascript Objects.
 */
function getBSONType(value: any): SchemaBSONType {
  const bsonType = value?._bsontype
    ? value._bsontype
    : Object.prototype.toString.call(value).replace(/^\[object (\w+)\]$/, '$1');

  if (bsonType === 'Object') {
    // In the resulting schema we rename `Object` to `Document`.
    return 'Document';
  }
  return bsonType;
}

function isNullType(type: SchemaAnalysisType): type is SchemaAnalysisNullType {
  return (type as SchemaAnalysisNullType).name === 'Null';
}

function isArrayType(type: SchemaAnalysisType): type is SchemaAnalysisArrayType {
  return (type as SchemaAnalysisArrayType).name === 'Array';
}

function isDocumentType(type: SchemaAnalysisType): type is SchemaAnalysisDocumentType {
  return (type as SchemaAnalysisDocumentType).name === 'Document';
}

/**
 * Recursively extracts all of the schema field paths as string arrays.
 */
function schemaToPaths(
  fields: SchemaAnalysisFieldsMap,
  parent: string[] = []
): string[][] {
  const paths: string[][] = [];
  const sortedFields = Object.values(fields).sort(fieldComparator);

  for (const field of sortedFields) {
    const path = [...parent, field.name];
    paths.push(path);

    // Recurse on doc.
    const doc = Object.values(field.types).find((f) => f.bsonType === 'Document') as
      | SchemaAnalysisDocumentType
      | undefined;

    if (doc) {
      paths.push(...schemaToPaths(doc.fields, path));
    }

    // Recurse on array.
    const array = Object.values(field.types).find((f) => f.bsonType === 'Array') as
      | SchemaAnalysisArrayType
      | undefined;
    if (array) {
      const arrayDoc = Object.values(array.types).find((f) => f.bsonType === 'Document') as
        | SchemaAnalysisDocumentType
        | undefined;

      if (arrayDoc) {
        paths.push(...schemaToPaths(arrayDoc.fields, path));
      }
    }
  }

  return paths;
}

export type SimplifiedSchemaBaseType = {
  bsonType: SchemaBSONType;
}
export type SimplifiedSchemaArrayType = SimplifiedSchemaBaseType & {
  bsonType: 'Array';
  // eslint-disable-next-line no-use-before-define
  types: SimplifiedSchemaType[];
}
export type SimplifiedSchemaDocumentType = SimplifiedSchemaBaseType & {
  bsonType: 'Document';
  // eslint-disable-next-line no-use-before-define
  fields: SimplifiedSchema;
}
export type SimplifiedSchemaType = SimplifiedSchemaBaseType | SimplifiedSchemaArrayType | SimplifiedSchemaDocumentType;
export type SimplifiedSchemaField = {
  types: SimplifiedSchemaType[];
};
export type SimplifiedSchema = {
  [fieldName: string]: SimplifiedSchemaField
}

function simplifiedSchema(fields: SchemaAnalysisFieldsMap): SimplifiedSchema {
  function finalizeSchemaFieldTypes(types: SchemaAnalysisFieldTypes): SimplifiedSchemaType[] {
    return Object.values(types).sort(
      (a: SchemaAnalysisType, b: SchemaAnalysisType) => {
        // Sort the types by what occurs most frequent first.
        return b.count - a.count;
      }
    ).map((type: SchemaAnalysisType) => {
      return {
        bsonType: type.bsonType, // Note: `Object` is replaced with `Document`.
        ...(isArrayType(type) ? {
          types: finalizeSchemaFieldTypes(type.types)
        } : {}),
        ...(isDocumentType(type) ? { fields: finalizeDocumentFieldSchema(type.fields) } : {})
      };
    });
  }

  function finalizeDocumentFieldSchema(fieldMap: SchemaAnalysisFieldsMap): SimplifiedSchema {
    const fieldSchema: SimplifiedSchema = Object.create(null);
    Object.values(fieldMap).forEach((field: SchemaAnalysisField) => {
      const fieldTypes = finalizeSchemaFieldTypes(field.types);

      fieldSchema[field.name] = {
        types: fieldTypes
      };
    });
    return fieldSchema;
  }

  return finalizeDocumentFieldSchema(fields);
}

function cropStringAt10kCharacters(value: string) {
  return value.charCodeAt(10000 - 1) === value.codePointAt(10000 - 1)
    ? value.slice(0, 10000)
    : value.slice(0, 10000 - 1);
}

function computeHasDuplicatesForType(type: SchemaAnalysisType, unique?: number) {
  if (isNullType(type)) {
    return type.count > 0;
  }

  if (!type.values) {
    return undefined;
  }

  return unique !== type.values.length;
}

function computeUniqueForType(type: SchemaAnalysisType) {
  if (isNullType(type)) {
    return type.count === 0 ? 0 : 1;
  }

  if (!type.values) {
    return undefined;
  }

  // As `values` is from a sample reservoir this isn't a true check for uniqueness.
  return new Set(type.values.map(extractStringValueFromBSON)).size;
}

/**
 * Final pass through the result to add missing information:
 *   - Compute `probability`, `unique`, `hasDuplicates` and
 *     `averageLength` fields.
 *   - Add `Undefined` pseudo-types.
 *   - Collapse `type` arrays to single string if length 1.
 *   - Turn fields and types objects into arrays to conform with original
 *     schema parser.
 */
function finalizeSchema(schemaAnalysis: SchemaAnalysisRoot): SchemaField[] {
  function finalizeArrayFieldProperties(type: SchemaAnalysisArrayType) {
    const totalCount = Object.values(type.types)
      .map((v: any) => v.count)
      .reduce((p, c) => p + c, 0);

    const types = finalizeSchemaFieldTypes(type.types, totalCount);

    return {
      types,
      totalCount,
      lengths: type.lengths,
      averageLength: totalCount / type.lengths.length
    };
  }

  function finalizeSchemaFieldTypes(types: SchemaAnalysisFieldTypes, parentCount: number): SchemaType[] {
    return Object.values(types).map((type) => {
      const unique = computeUniqueForType(type);

      return {
        name: type.name,
        path: type.path,
        count: type.count,
        probability: type.count / parentCount,
        unique,
        hasDuplicates: computeHasDuplicatesForType(type, unique),
        values: isNullType(type) ? undefined : type.values,
        bsonType: type.bsonType, // Note: `Object` is replaced with `Document`.
        ...(isArrayType(type) ? finalizeArrayFieldProperties(type) : {}),
        ...(isDocumentType(type) ? { fields: finalizeDocumentFieldSchema(type.fields, type.count) } : {})
      };
    }).sort((a, b) => b.probability - a.probability);
  }

  function finalizeDocumentFieldSchema(fieldMap: SchemaAnalysisFieldsMap, parentCount: number): SchemaField[] {
    return Object.values(fieldMap).map((field: SchemaAnalysisField): SchemaField => {
      const fieldTypes = finalizeSchemaFieldTypes(field.types, parentCount);

      const undefinedCount = parentCount - field.count;
      if (undefinedCount > 0) {
        // Add the `Undefined` pseudo-type.
        fieldTypes.push({
          name: 'Undefined',
          bsonType: 'Undefined',
          unique: undefinedCount > 1 ? 0 : 1,
          hasDuplicates: undefinedCount > 1,
          path: field.path,
          count: undefinedCount,
          probability: undefinedCount / parentCount
        });
      }

      return {
        name: field.name,
        path: field.path,
        count: field.count,
        type: fieldTypes.length === 1 ? fieldTypes[0].name : fieldTypes.map((v: SchemaType) => v.name), // Or one value or array.
        probability: field.count / parentCount,
        hasDuplicates: !!fieldTypes.find((v: SchemaType) => v.hasDuplicates),
        types: fieldTypes
      };
    }).sort(fieldComparator);
  }

  return finalizeDocumentFieldSchema(schemaAnalysis.fields, schemaAnalysis.count);
}

export class SchemaAnalyzer {
  semanticTypes: SemanticTypeMap;
  options: SchemaParseOptions;
  documentsAnalyzed = 0;
  schemaAnalysisRoot: SchemaAnalysisRoot = {
    fields: Object.create(null),
    count: 0
  };

  finalized = true;
  schemaResult: Schema = {
    count: 0,
    fields: []
  };

  constructor(options?: SchemaParseOptions) {
    // Set default options.
    this.options = { semanticTypes: false, storeValues: true, ...options };

    this.semanticTypes = {
      ...semanticTypes
    };

    if (typeof this.options.semanticTypes === 'object') {
      // Enable existing semantic types that evaluate to true.
      const enabledTypes = Object.entries(this.options.semanticTypes)
        .filter(([, v]) => typeof v === 'boolean' && v)
        .map(([k]) => k.toLowerCase());

      this.semanticTypes = {
        ...Object.entries(this.semanticTypes)
          .filter(([k]) => enabledTypes.includes(k.toLowerCase()))
          .reduce((p, [k, v]) => ({ ...p, [k]: v }), Object.create(null))
      };

      Object.entries(this.options.semanticTypes)
        .filter(([, v]) => typeof v === 'function')
        .forEach(([k, v]) => {
          this.semanticTypes[k] = v;
        });
    }
  }

  getSemanticType(value: BSONValue, path: string[]) {
    // Pass value to semantic type detectors, return first match or undefined.
    const returnValue = Object.entries(this.semanticTypes)
      .filter(([, v]) => {
        return (v as SemanticTypeFunction)(value, path);
      })
      .map(([k]) => k)[0];

    return returnValue;
  }

  analyzeDoc(doc: Document) {
    this.finalized = false;
    /**
     * Takes a field value, determines the correct type, handles recursion into
     * nested arrays and documents, and passes the value down to `addToValue`.
     * Note: This mutates the `schema` argument.
     */
    const addToType = (path: string[], value: BSONValue, schema: SchemaAnalysisFieldTypes) => {
      const bsonType = getBSONType(value);
      // If semantic type detection is enabled, the type is the semantic type
      // or the original bson type if no semantic type was detected. If disabled,
      // it is always the bson type.
      const typeName = (this.options.semanticTypes) ? this.getSemanticType(value, path) || bsonType : bsonType;
      if (!schema[typeName]) {
        schema[typeName] = {
          name: typeName,
          bsonType: bsonType,
          path,
          count: 0
        };
      }
      const type = schema[typeName];
      type.count++;

      if (isArrayType(type)) {
        // Recurse into arrays by calling `addToType` for each element.
        type.types = type.types ?? Object.create(null);
        type.lengths = type.lengths ?? [];
        type.lengths.push((value as BSONValue[]).length);
        (value as BSONValue[]).forEach((v: BSONValue) => addToType(path, v, type.types));
      } else if (isDocumentType(type)) {
        // Recurse into nested documents by calling `addToField` for all sub-fields.
        type.fields = type.fields ?? Object.create(null);
        Object.entries(value as Document).forEach(
          ([fieldName, v]) => addToField(fieldName, [...path, fieldName], v, type.fields)
        );
      } else if (this.options.storeValues && !isNullType(type)) {
        // When the `storeValues` option is enabled, store some example values.
        if (!type.values) {
          type.values = bsonType === 'String'
            ? Reservoir(100) : Reservoir(10000);
        }

        type.values.pushSome(
          type.name === 'String' ? cropStringAt10kCharacters(value as string) : value
        );
      }
    };

    /**
     * Handles a field from a document. Passes the value to `addToType`.
     * Note: This mutates the `schema` argument.
     */
    const addToField = (fieldName: string, path: string[], value: BSONValue, schema: SchemaAnalysisFieldsMap) => {
      if (!schema[fieldName]) {
        schema[fieldName] = {
          name: fieldName,
          path: path,
          count: 0,
          types: Object.create(null)
        };
      }
      const field = schema[fieldName];

      field.count++;
      addToType(path, value, field.types);
    };

    for (const key of Object.keys(doc)) {
      addToField(key, [key], doc[key], this.schemaAnalysisRoot.fields);
    }
    this.schemaAnalysisRoot.count += 1;
  }

  getResult(): Schema {
    if (this.finalized) {
      return this.schemaResult;
    }

    this.schemaResult = {
      count: this.schemaAnalysisRoot.count,
      fields: finalizeSchema(this.schemaAnalysisRoot)
    };

    this.finalized = true;
    return this.schemaResult;
  }

  getSchemaPaths(): string[][] {
    return schemaToPaths(this.schemaAnalysisRoot.fields);
  }

  /**
   * Returns a simplified schema result, this has no type metadata.
   */
  getSimplifiedSchema(): SimplifiedSchema {
    return simplifiedSchema(this.schemaAnalysisRoot.fields);
  }
}

export function verifyStreamSource(
  source: AnyIterable
): AnyIterable {
  if (!(Symbol.iterator in source) && !(Symbol.asyncIterator in source)) {
    throw new Error(
      'Unknown input type for `docs`. Must be an array, ' +
        'stream or MongoDB Cursor.'
    );
  }

  return source;
}

export async function getCompletedSchemaAnalyzer(
  source: AnyIterable,
  options?: SchemaParseOptions
): Promise<SchemaAnalyzer> {
  const analyzer = new SchemaAnalyzer(options);
  for await (const doc of verifyStreamSource(source)) {
    if (options?.signal?.aborted) throw options.signal.aborted;
    analyzer.analyzeDoc(doc);
  }
  return analyzer;
}
