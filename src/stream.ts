import es from 'event-stream';
import Reservoir from 'reservoir';
import _ from 'lodash';
import type { Document } from 'bson';

import semanticTypeRegisters from './semantic-types';

// TODO: Can we clean these types up somehow?

type BaseSchemaType = {
  path: string;
  count: number;
  probability: number;
  has_duplicates: boolean;
  unique: number;
}

type ConstantSchemaType = BaseSchemaType & {
  name: 'Null' | 'Undefined';
}

export type PrimitiveSchemaType = BaseSchemaType & {
  name: 'String' | 'Number' | 'Int32' | 'Boolean' | 'Decimal128' | 'Long' | 'ObjectID' | 'Date' | 'RegExp' | 'Symbol' | 'MaxKey' | 'MinKey' | 'Binary' | 'Code' | 'Timestamp' | 'DBRef';
  values: any[];
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

export type SchemaType = ConstantSchemaType | PrimitiveSchemaType | ArraySchemaType | DocumentSchemaType;

export type SchemaField = {
  name: string;
  count: number; // TODO: This count might not always be there?
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

// Used when building the end Schema.
type SchemaBuildingMap = {
  [typeName: string]: {
    name: string;
    path: string;
    count: number;
    lengths?: number[];
    average_length?: number;
    total_count?: number;
    types?: SchemaBuildingMap;

    fields?: SchemaBuildingMap;

    values?: {
      // Reservoir type.
      pushSome: (value: any) => void;
    };
  }
}

/**
* Extracts a Javascript string from a BSON type to compute unique values.
*/
function extractStringValueFromBSON(value: any): string {
  if (value && value._bsontype) {
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
 * Final pass through the result to add missing information:
 *   - compute `probability`, `unique`, `has_duplicates` and
 *     `average_length` fields
 *   - add `Undefined` pseudo-types
 *   - collapse `type` arrays to single string if length 1
 *   - turns fields and types objects into arrays to conform with original
 *     schema parser
 * This mutates the passed in schema.
 */
function finalizeSchema(schema: any, parent?: any, tag?: string) {
  if (schema === undefined) {
    return schema;
  }

  if (tag === undefined) {
    // Recursively finalize fields.
    // debug('recursively calling schema.fields');
    finalizeSchema(schema.fields, schema, 'fields');
  }
  if (tag === 'fields') {
    Object.values(schema).forEach((field: any) => {
      // Create `Undefined` pseudo-type.
      const missing = parent.count - field.count;
      if (missing > 0) {
        field.types.Undefined = {
          name: 'Undefined',
          type: 'Undefined',
          path: field.path,
          count: missing
        };
      }
      field.total_count = Object.values(field.types)
        .map((v: any) => v.count)
        .reduce((p, c) => p + c, 0);

      // Recursively finalize types.
      finalizeSchema(field.types, field, 'types');
      field.type = field.types.map((v: SchemaField) => v.name);
      if (field.type.length === 1) {
        field.type = field.type[0];
      }
      // A field has duplicates when any of its types have duplicates.
      field.has_duplicates = !!field.types.find((v: SchemaField) => v.has_duplicates);
      // Compute probability.
      field.probability = field.count / parent.count;
    });
    // turn object into array
    parent.fields = Object.values(parent.fields as SchemaField[]).sort(fieldComparator);
  }
  if (tag === 'types') {
    Object.values(schema).forEach((type: any) => {
      type.total_count = (type.lengths || []).reduce((p: number, c: number) => p + c || 0, 0);
      // debug('recursively calling schema.fields');
      finalizeSchema(type.fields, type, 'fields');
      // debug('recursively calling schema.types');
      finalizeSchema(type.types, type, 'types');
      // compute `probability` for each type
      type.probability = type.count / (parent.total_count || parent.count);
      // compute `unique` and `has_duplicates` for each type
      if (type.name === 'Null' || type.name === 'Undefined') {
        delete type.values;
        type.unique = type.count === 0 ? 0 : 1;
        type.has_duplicates = type.count > 1;
      } else if (type.values) {
        type.unique = new Set(type.values.map(extractStringValueFromBSON)).size;
        type.has_duplicates = type.unique !== type.values.length;
      }
      // compute `average_length` for array types
      if (type.lengths) {
        type.average_length = type.total_count / type.lengths.length;
      }
      // recursively finalize fields and types
    });
    parent.types = Object.values(parent.types as SchemaType[]).sort((a, b) => b.probability - a.probability);
  }
}

type SemanticTypeFunction = ((value: string, path?: string) => boolean);
type SemanticTypeMap = {
  [typeName: string]: SemanticTypeFunction | boolean;
};

export type SchemaParseOptions = {
  semanticTypes?: boolean | SemanticTypeMap;
  storeValues?: boolean;
};

/**
 * Main entry point for schema parsing.
 */
function parse(options?: SchemaParseOptions) {
  // Set default options.
  options = { semanticTypes: false, storeValues: true, ...options };

  let semanticTypes: SemanticTypeMap = {
    ...semanticTypeRegisters
  };

  if (typeof options.semanticTypes === 'object') {
    // enable existing types that evaluate to true
    const enabledTypes = Object.entries(options.semanticTypes)
      .filter(([, v]) => typeof v === 'boolean' && v)
      .map(([k]) => k.toLowerCase());

    semanticTypes = {
      ...Object.entries(semanticTypes)
        .filter(([k]) => enabledTypes.includes(k.toLowerCase()))
        .reduce((p, [k, v]) => ({ ...p, [k]: v }), {})
    };

    Object.entries(options.semanticTypes)
      .filter(([, v]) => typeof v === 'function')
      .forEach(([k, v]) => { semanticTypes[k] = v; });
  }

  const rootSchema: {
    fields: SchemaBuildingMap;
    count: number;
  } = {
    fields: {},
    count: 0
  };

  let finalized = false;

  /**
   * Returns the type of value as a string. BSON type aware. Replaces `Object`
   * with `Document` to avoid naming conflicts with javascript Objects.
   */
  function getBSONType(value: any): string {
    let T;
    if (value && value._bsontype) {
      T = value._bsontype;
    } else {
      T = Object.prototype.toString.call(value).replace(/\[object (\w+)\]/, '$1');
    }
    if (T === 'Object') {
      T = 'Document';
    }
    return T;
  }

  function getSemanticType(value: any, path: string) {
    // Pass value to semantic type detectors, return first match or undefined.

    const returnValue = Object.entries(semanticTypes)
      .filter(([, v]) => {
        return (v as SemanticTypeFunction)(value, path);
      })
      .map(([k]) => k)[0];
    return returnValue;
  }

  /**
   * Handles adding the value to the value reservoir. Will also crop
   * strings at 10,000 characters.
   *
   * @param {Object} type    the type object from `addToType`
   * @param {Any}    value   the value to be added to `type.values`
   */
  function addToValue(type: SchemaBuildingMap[string], value: any) {
    if (type.name === 'String') {
      // Crop strings at 10k characters,
      if (value.length > 10000) {
        value = value.slice(0, 10000);
      }
    }
    type.values!.pushSome(value);
  }

  /**
   * Takes a field value, determines the correct type, handles recursion into
   * nested arrays and documents, and passes the value down to `addToValue`.
   *
   * @param {String}  path     field path in dot notation
   * @param {Any}     value    value of the field
   * @param {Object}  schema   the updated schema object
   */

  function addToType(path: string, value: any, schema: SchemaBuildingMap) {
    const bsonType = getBSONType(value);
    // If semantic type detection is enabled, the type is the semantic type
    // or the original bson type if no semantic type was detected. If disabled,
    // it is always the bson type.
    const typeName = (options?.semanticTypes) ? getSemanticType(value, path) || bsonType : bsonType;
    const type = schema[typeName] = _.get(schema, typeName, {
      name: typeName,
      bsonType: bsonType,
      path: path,
      count: 0
    } as SchemaBuildingMap[string]);
    type.count++;
    // Recurse into arrays by calling `addToType` for each element.
    if (typeName === 'Array') {
      type.types = type.types ?? {};
      type.lengths = type.lengths || [];
      type.lengths.push(value.length);
      value.forEach((v: SchemaBuildingMap) => addToType(path, v, type.types!));

    // Recurse into nested documents by calling `addToField` for all sub-fields.
    } else if (typeName === 'Document') {
      type.fields = _.get(type, 'fields', {});
      Object.entries(value).forEach(([k, v]) => addToField(`${path}.${k}`, v, type.fields!));

    // If the `storeValues` option is enabled, store some example values.
    } else if (options?.storeValues) {
      const defaultValue = bsonType === 'String'
        ? Reservoir(100) : Reservoir(10000);
      type.values = type.values || defaultValue;

      addToValue(type, value);
    }
  }

  /**
   * Handles a field from a document. Passes the value to `addToType`.
   *
   * @param {String}  path     field path in dot notation
   * @param {Any}     value    value of the field
   * @param {Object}  schema   the updated schema object
   */
  function addToField(path: string, value: any, schema: SchemaBuildingMap) {
    const pathSplitOnDot = path.split('.');
    const defaults = {
      [path]: {
        name: pathSplitOnDot[pathSplitOnDot.length - 1],
        path: path,
        count: 0,
        types: {}
      }
    };
    _.defaultsDeep(schema, defaults);
    const field = schema[path];

    field.count++;
    // debug('added to field', field);
    addToType(path, value, field.types!);
  }

  function cleanup() {
    if (!finalized) {
      finalizeSchema(rootSchema as SchemaBuildingMap[string]);
      finalized = true;
    }
  }

  // Cast es to any as the current typings version does not
  // have `through` declared. We'll want to move away from
  // the event-stream package eventually as it's archived on GitHub.
  const parser = (es as any).through(function write(obj: Document) {
    Object.keys(obj).forEach(
      key => addToField(key, obj[key], rootSchema.fields)
    );
    rootSchema.count += 1;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-error
    this.emit('progress', obj);
  }, function end() {
    cleanup();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-error
    this.emit('data', rootSchema);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-error
    this.emit('end');
  });

  parser.on('close', function() {
    cleanup();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-error
    this.destroy();
  });

  return parser;
}

export default parse;
