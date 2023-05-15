
/* eslint-disable camelcase */
import Reservoir from 'reservoir';
import type {
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
  path: string;
  name: string;
  count: number;
  probability: number;
  bsonType: string;

  // As `values` is from a sample reservoir this isn't a true check for duplicates/uniqueness.
  // We cannot compute `unique` and `has_duplicates` when `storeValues` is false.
  has_duplicates?: boolean;
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
  average_length: number;
  total_count: number;
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
  path: string;
  type: string | string[];
  probability: number;
  has_duplicates: boolean;
  types: SchemaType[];
};

export type Schema = {
  count: number;
  fields: SchemaField[]
}

type SchemaBSONType = Exclude<keyof TypeCastMap, 'Object'> | 'Document';

type SchemaAnalysisBaseType = {
  name: string;
  path: string;
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
  path: string;
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

type SemanticTypeFunction = ((value: BSONValue, path?: string) => boolean);
type SemanticTypeMap = {
  [typeName: string]: SemanticTypeFunction | boolean;
};

export type SchemaParseOptions = {
  semanticTypes?: boolean | SemanticTypeMap;
  storeValues?: boolean;
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

function fieldComparator(a: SchemaField, b: SchemaField) {
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
  return (<SchemaAnalysisNullType>type).name === 'Null';
}

function isArrayType(type: SchemaAnalysisType): type is SchemaAnalysisArrayType {
  return (<SchemaAnalysisArrayType>type).name === 'Array';
}

function isDocumentType(type: SchemaAnalysisType): type is SchemaAnalysisDocumentType {
  return (<SchemaAnalysisDocumentType>type).name === 'Document';
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
 *   - Compute `probability`, `unique`, `has_duplicates` and
 *     `average_length` fields.
 *   - Add `Undefined` pseudo-types.
 *   - Collapse `type` arrays to single string if length 1.
 *   - Turn fields and types objects into arrays to conform with original
 *     schema parser.
 */
function finalizeSchema(schemaAnalysis: SchemaAnalysisRoot): SchemaField[] {
  function finalizeArrayFieldProperties(type: SchemaAnalysisArrayType) {
    const total_count = Object.values(type.types)
      .map((v: any) => v.count)
      .reduce((p, c) => p + c, 0);

    const types = finalizeSchemaFieldTypes(type.types, total_count);

    return {
      types,
      total_count,
      lengths: type.lengths,
      average_length: total_count / type.lengths.length
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
        has_duplicates: computeHasDuplicatesForType(type, unique),
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
          has_duplicates: undefinedCount > 1,
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
        has_duplicates: !!fieldTypes.find((v: SchemaType) => v.has_duplicates),
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
    fields: {},
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
          .reduce((p, [k, v]) => ({ ...p, [k]: v }), {})
      };

      Object.entries(this.options.semanticTypes)
        .filter(([, v]) => typeof v === 'function')
        .forEach(([k, v]) => {
          this.semanticTypes[k] = v;
        });
    }
  }

  getSemanticType(value: BSONValue, path: string) {
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
    const addToType = (path: string, value: BSONValue, schema: SchemaAnalysisFieldTypes) => {
      const bsonType = getBSONType(value);
      // If semantic type detection is enabled, the type is the semantic type
      // or the original bson type if no semantic type was detected. If disabled,
      // it is always the bson type.
      const typeName = (this.options.semanticTypes) ? this.getSemanticType(value, path) || bsonType : bsonType;
      if (!schema[typeName]) {
        schema[typeName] = {
          name: typeName,
          bsonType: bsonType,
          path: path,
          count: 0
        };
      }
      const type = schema[typeName];
      type.count++;

      if (isArrayType(type)) {
        // Recurse into arrays by calling `addToType` for each element.
        type.types = type.types ?? {};
        type.lengths = type.lengths ?? [];
        type.lengths.push((value as BSONValue[]).length);
        (value as BSONValue[]).forEach((v: BSONValue) => addToType(path, v, type.types));
      } else if (isDocumentType(type)) {
        // Recurse into nested documents by calling `addToField` for all sub-fields.
        type.fields = type.fields ?? {};
        Object.entries(value as Document).forEach(([k, v]) => addToField(`${path}.${k}`, v, type.fields));
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
    const addToField = (path: string, value: BSONValue, schema: SchemaAnalysisFieldsMap) => {
      if (!schema[path]) {
        schema[path] = {
          name: path.split('.')?.pop() || path,
          path: path,
          count: 0,
          types: {}
        };
      }
      const field = schema[path];

      field.count++;
      addToType(path, value, field.types);
    };

    for (const key of Object.keys(doc)) {
      addToField(key, doc[key], this.schemaAnalysisRoot.fields);
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
}
