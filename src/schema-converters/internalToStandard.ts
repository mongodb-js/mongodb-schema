import { JSONSchema4TypeName } from 'json-schema';
import { ArraySchemaType, DocumentSchemaType, Schema as InternalSchema, SchemaType } from '../schema-analyzer';
import { StandardJSONSchema } from '../types';
import { allowAbort } from './util';

type StandardTypeDefinition = { type: JSONSchema4TypeName, $ref?: never; } | { $ref: string, type?: never };

type TypeToDefinitionMap = Record<
SchemaType['name'] | 'Double' | 'BSONSymbol', StandardTypeDefinition
>;
export const InternalTypeToStandardTypeMap: TypeToDefinitionMap = {
  Double: { $ref: '#/$defs/Double' },
  Number: { $ref: '#/$defs/Double' },
  String: { type: 'string' },
  Document: { type: 'object' },
  Array: { type: 'array' },
  Binary: { $ref: '#/$defs/Binary' },
  Undefined: { $ref: '#/$defs/Undefined' },
  ObjectId: { $ref: '#/$defs/ObjectId' },
  Boolean: { type: 'boolean' },
  Date: { $ref: '#/$defs/Date' },
  Null: { type: 'null' },
  RegExp: { $ref: '#/$defs/RegExp' },
  BSONRegExp: { $ref: '#/$defs/RegExp' },
  DBRef: { $ref: '#/$defs/DBRef' },
  DBPointer: { $ref: '#/$defs/DBPointer' },
  BSONSymbol: { $ref: '#/$defs/BSONSymbol' },
  Code: { $ref: '#/$defs/Code' },
  CodeWScope: { $ref: '#/$defs/CodeWScope' },
  Int32: { type: 'integer' },
  Timestamp: { $ref: '#/$defs/Timestamp' },
  Long: { type: 'integer' },
  Decimal128: { $ref: '#/$defs/Decimal128' },
  MinKey: { $ref: '#/$defs/MinKey' },
  MaxKey: { $ref: '#/$defs/MaxKey' }
};

export const RELAXED_EJSON_DEFINITIONS = {
  ObjectId: {
    type: 'object',
    properties: {
      $oid: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{24}$'
      }
    },
    required: ['$oid'],
    additionalProperties: false
  },
  BSONSymbol: {
    type: 'object',
    properties: {
      $symbol: {
        type: 'string'
      }
    },
    required: ['$symbol'],
    additionalProperties: false
  },
  Double: {
    oneOf: [
      { type: 'number' },
      {
        type: 'object',
        properties: {
          $numberDouble: {
            enum: ['Infinity', '-Infinity', 'NaN']
          }
        }
      }
    ]
  },
  Decimal128: {
    type: 'object',
    properties: {
      $numberDecimal: {
        type: 'string'
      }
    },
    required: ['$numberDecimal'],
    additionalProperties: false
  },
  Binary: {
    type: 'object',
    properties: {
      $binary: {
        type: 'object',
        properties: {
          base64: {
            type: 'string'
          },
          subType: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{1,2}$' // BSON binary type as a one- or two-character hex string
          }
        },
        required: ['base64', 'subType'],
        additionalProperties: false
      }
    },
    required: ['$binary'],
    additionalProperties: false
  },
  Code: {
    type: 'object',
    properties: {
      $code: {
        type: 'string'
      }
    },
    required: ['$code'],
    additionalProperties: false
  },
  CodeWScope: {
    type: 'object',
    properties: {
      $code: {
        type: 'string'
      },
      $scope: {
        type: 'object'
      }
    },
    required: ['$code', '$scope'],
    additionalProperties: false
  },
  Timestamp: {
    type: 'object',
    properties: {
      $timestamp: {
        type: 'object',
        properties: {
          t: {
            type: 'integer',
            minimum: 0
          },
          i: {
            type: 'integer',
            minimum: 0
          }
        },
        required: ['t', 'i'],
        additionalProperties: false
      }
    },
    required: ['$timestamp'],
    additionalProperties: false
  },
  RegExp: {
    type: 'object',
    properties: {
      $regularExpression: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string'
          },
          options: {
            type: 'string',
            pattern: '^[gimuy]*$'
          }
        },
        required: ['pattern'],
        additionalProperties: false
      }
    },
    required: ['$regularExpression'],
    additionalProperties: false
  },
  DBPointer: {
    type: 'object',
    properties: {
      $dbPointer: {
        type: 'object',
        properties: {
          $ref: {
            type: 'string'
          },
          $id: {
            $ref: '#/$defs/ObjectId'
          }
        },
        required: ['$ref', '$id'],
        additionalProperties: false
      }
    },
    required: ['$dbPointer'],
    additionalProperties: false
  },
  Date: {
    type: 'object',
    properties: {
      $date: {
        type: 'string',
        format: 'date-time'
      }
    },
    required: ['$date'],
    additionalProperties: false
  },
  DBRef: {
    type: 'object',
    properties: {
      $ref: {
        type: 'string'
      },
      $id: {},
      $db: {
        type: 'string'
      }
    },
    required: ['$ref', '$id'],
    additionalProperties: true
  },
  MinKey: {
    type: 'object',
    properties: {
      $minKey: {
        type: 'integer',
        const: 1
      }
    },
    required: ['$minKey'],
    additionalProperties: false
  },
  MaxKey: {
    type: 'object',
    properties: {
      $maxKey: {
        type: 'integer',
        const: 1
      }
    },
    required: ['$maxKey'],
    additionalProperties: false
  },
  Undefined: {
    type: 'object',
    properties: {
      $undefined: {
        type: 'boolean',
        const: true
      }
    },
    required: ['$undefined'],
    additionalProperties: false
  }
};

const createConvertInternalToStandard = function() {
  const usedDefinitions = new Set<string>();

  function getUsedDefinitions() {
    const filteredDefinitions = Object.fromEntries(
      Object.entries(RELAXED_EJSON_DEFINITIONS).filter(([key]) => usedDefinitions.has(key))
    );
    return Object.freeze(filteredDefinitions);
  }

  function markUsedDefinition(ref: string) {
    usedDefinitions.add(ref.split('/')[2]);
  }

  function convertInternalType(internalType: string) {
    const type = InternalTypeToStandardTypeMap[internalType];
    if (!type) throw new Error(`Encountered unknown type: ${internalType}`);
    return { ...type };
  }

  async function parseType(type: SchemaType, signal?: AbortSignal): Promise<StandardJSONSchema> {
    await allowAbort(signal);
    const schema: StandardJSONSchema = convertInternalType(type.bsonType);
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

  function isPlainTypesOnly(types: StandardJSONSchema[]): types is { type: JSONSchema4TypeName }[] {
    return types.every(definition => !!definition.type && Object.keys(definition).length === 1);
  }

  async function parseTypes(types: SchemaType[], signal?: AbortSignal): Promise<StandardJSONSchema> {
    await allowAbort(signal);
    const definedTypes = types.filter(type => type.bsonType.toLowerCase() !== 'undefined');
    const isSingleType = definedTypes.length === 1;
    if (isSingleType) {
      return parseType(definedTypes[0], signal);
    }
    const parsedTypes = await Promise.all(definedTypes.map(type => parseType(type, signal)));
    if (isPlainTypesOnly(parsedTypes)) {
      return {
        type: parsedTypes.map(({ type }) => type)
      };
    }
    return {
      anyOf: parsedTypes
    };
  }

  async function parseFields(
    fields: DocumentSchemaType['fields'],
    signal?: AbortSignal
  ): Promise<{ required: StandardJSONSchema['required']; properties: StandardJSONSchema['properties'] }> {
    const required = [];
    const properties: StandardJSONSchema['properties'] = {};
    for (const field of fields) {
      if (field.probability === 1) required.push(field.name);
      properties[field.name] = await parseTypes(field.types, signal);
    }
    return { required, properties };
  }

  return async function convert(
    internalSchema: InternalSchema,
    options: { signal?: AbortSignal } = {}
  ): Promise<StandardJSONSchema> {
    const { required, properties } = await parseFields(internalSchema.fields, options.signal);
    const schema: StandardJSONSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required,
      properties,
      $defs: getUsedDefinitions()
    };
    return schema;
  };
};

export function convertInternalToStandard(
  internalSchema: InternalSchema,
  options: { signal?: AbortSignal } = {}
): Promise<StandardJSONSchema> {
  return createConvertInternalToStandard()(internalSchema, options);
}
