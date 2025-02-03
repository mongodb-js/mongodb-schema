import { JSONSchema4TypeName } from 'json-schema';
import { ArraySchemaType, DocumentSchemaType, Schema as InternalSchema, SchemaType } from '../schema-analyzer';
import { StandardJSONSchema } from '../types';

type StandardTypeDefinition = { type: JSONSchema4TypeName, $ref?: never; } | { $ref: string, type?: never };

const InternalTypeToStandardTypeMap: Record<
  SchemaType['name'] | 'Double' | 'BSONSymbol', StandardTypeDefinition
> = {
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
  Symbol: { $ref: '#/$defs/BSONSymbol' },
  Code: { $ref: '#/$defs/Code' },
  Int32: { type: 'integer' },
  Timestamp: { $ref: '#/$defs/Timestamp' },
  Long: { type: 'integer' },
  Decimal128: { $ref: '#/$defs/Decimal' },
  MinKey: { $ref: '#/$defs/MinKey' },
  MaxKey: { $ref: '#/$defs/MaxKey' }
};

export const RELAXED_EJSON_DEFINITIONS = Object.freeze({
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
        enum: ['Infinity', '-Infinity', 'NaN']
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
        type: 'object' // TODO: object is ejson object hmm
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
            $ref: '#/$defs/Decimal'
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
});

const convertInternalType = (internalType: string) => {
  const type = InternalTypeToStandardTypeMap[internalType];
  if (!type) throw new Error(`Encountered unknown type: ${internalType}`);
  return type;
};

async function allowAbort(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) =>
    setTimeout(() => {
      if (signal?.aborted) return reject(signal?.reason || new Error('Operation aborted'));
      resolve();
    })
  );
}

async function parseType(type: SchemaType, signal?: AbortSignal): Promise<StandardJSONSchema> {
  await allowAbort(signal);
  const schema: StandardJSONSchema = convertInternalType(type.bsonType);
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

function isSimpleTypesOnly(types: StandardTypeDefinition[]): types is { type: JSONSchema4TypeName }[] {
  return types.every(definition => !definition.$ref);
}

async function parseTypes(types: SchemaType[], signal?: AbortSignal): Promise<StandardJSONSchema> {
  await allowAbort(signal);
  const definedTypes = types.filter(type => type.bsonType.toLowerCase() !== 'undefined');
  const isSingleType = definedTypes.length === 1;
  if (isSingleType) {
    return parseType(definedTypes[0], signal);
  }
  const parsedTypes = await Promise.all(definedTypes.map(type => parseType(type, signal)));
  if (definedTypes.some(type => ['Document', 'Array'].includes(type.bsonType))) {
    return {
      anyOf: parsedTypes
    };
  }
  const convertedTypes = definedTypes.map((type) => convertInternalType(type.bsonType));
  if (isSimpleTypesOnly(convertedTypes)) {
    return {
      type: convertedTypes.map(({ type }) => type)
    };
  }
  return {
    anyOf: convertedTypes
  };
}

async function parseFields(fields: DocumentSchemaType['fields'], signal?: AbortSignal): Promise<{
  required: StandardJSONSchema['required'],
  properties: StandardJSONSchema['properties'],
}> {
  const required = [];
  const properties: StandardJSONSchema['properties'] = {};
  for (const field of fields) {
    if (field.probability === 1) required.push(field.name);
    properties[field.name] = await parseTypes(field.types, signal);
  }

  return { required, properties };
}

export default async function internalSchemaToMongodb(
  internalSchema: InternalSchema,
  options: {
    signal?: AbortSignal
} = {}): Promise<StandardJSONSchema> {
  const { required, properties } = await parseFields(internalSchema.fields, options.signal);
  const schema: StandardJSONSchema = {
    type: 'object',
    required,
    properties,
    $defs: RELAXED_EJSON_DEFINITIONS
  };
  return schema;
}
