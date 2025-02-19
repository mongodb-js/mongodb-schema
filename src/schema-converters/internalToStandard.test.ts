import assert from 'assert';
import Ajv2020 from 'ajv/dist/2020';
import { convertInternalToStandard, RELAXED_EJSON_DEFINITIONS } from './internalToStandard';

describe('internalSchemaToStandard', async function() {
  const ajv = new Ajv2020();

  describe('Converts: ', async function() {
    it('all the types', async function() {
      const internal = {
        count: 1,
        fields: [
          {
            name: '_id',
            path: [
              '_id'
            ],
            count: 1,
            type: 'ObjectId',
            probability: 0.8,
            hasDuplicates: false,
            types: [
              {
                name: 'ObjectId',
                path: [
                  '_id'
                ],
                count: 1,
                probability: 0.8,
                unique: 1,
                hasDuplicates: false,
                values: [
                  '642d766b7300158b1f22e972'
                ],
                bsonType: 'ObjectId'
              }
            ]
          },
          {
            name: 'array',
            path: [
              'array'
            ],
            count: 1,
            type: 'Array',
            probability: 0.8,
            hasDuplicates: false,
            types: [
              {
                name: 'Array',
                path: [
                  'array'
                ],
                count: 1,
                probability: 0.8,
                bsonType: 'Array',
                types: [
                  {
                    name: 'Number',
                    path: [
                      'array'
                    ],
                    count: 3,
                    probability: 0.8,
                    unique: 3,
                    hasDuplicates: false,
                    values: [
                      1,
                      2,
                      3
                    ],
                    bsonType: 'Number'
                  }
                ],
                totalCount: 3,
                lengths: [
                  3
                ],
                averageLength: 3
              }
            ]
          },
          {
            name: 'binaries',
            path: [
              'binaries'
            ],
            count: 1,
            type: 'Document',
            probability: 0.8,
            hasDuplicates: false,
            types: [
              {
                name: 'Document',
                path: [
                  'binaries'
                ],
                count: 1,
                probability: 0.8,
                bsonType: 'Document',
                fields: [
                  {
                    name: 'binaryOld',
                    path: [
                      'binaries',
                      'binaryOld'
                    ],
                    count: 1,
                    type: 'Binary',
                    probability: 0.8,
                    hasDuplicates: false,
                    types: [
                      {
                        name: 'Binary',
                        path: [
                          'binaries',
                          'binaryOld'
                        ],
                        count: 1,
                        probability: 0.8,
                        unique: 1,
                        hasDuplicates: false,
                        values: [
                          '//8='
                        ],
                        bsonType: 'Binary'
                      }
                    ]
                  },
                  {
                    name: 'compressedTimeSeries',
                    path: [
                      'binaries',
                      'compressedTimeSeries'
                    ],
                    count: 1,
                    type: 'Binary',
                    probability: 0.8,
                    hasDuplicates: false,
                    types: [
                      {
                        name: 'Binary',
                        path: [
                          'binaries',
                          'compressedTimeSeries'
                        ],
                        count: 1,
                        probability: 0.8,
                        unique: 1,
                        hasDuplicates: false,
                        values: [
                          'c//SZESzTGmQ6OfR38A11A=='
                        ],
                        bsonType: 'Binary'
                      }
                    ]
                  },
                  {
                    name: 'custom',
                    path: [
                      'binaries',
                      'custom'
                    ],
                    count: 1,
                    type: 'Binary',
                    probability: 0.8,
                    hasDuplicates: false,
                    types: [
                      {
                        name: 'Binary',
                        path: [
                          'binaries',
                          'custom'
                        ],
                        count: 1,
                        probability: 0.8,
                        unique: 1,
                        hasDuplicates: false,
                        values: [
                          '//8='
                        ],
                        bsonType: 'Binary'
                      }
                    ]
                  },
                  {
                    name: 'encrypted',
                    path: [
                      'binaries',
                      'encrypted'
                    ],
                    count: 1,
                    type: 'Binary',
                    probability: 0.8,
                    hasDuplicates: false,
                    types: [
                      {
                        name: 'Binary',
                        path: [
                          'binaries',
                          'encrypted'
                        ],
                        count: 1,
                        probability: 0.8,
                        unique: 1,
                        hasDuplicates: false,
                        values: [
                          'c//SZESzTGmQ6OfR38A11A=='
                        ],
                        bsonType: 'Binary'
                      }
                    ]
                  },
                  {
                    name: 'functionData',
                    path: [
                      'binaries',
                      'functionData'
                    ],
                    count: 1,
                    type: 'Binary',
                    probability: 0.8,
                    hasDuplicates: false,
                    types: [
                      {
                        name: 'Binary',
                        path: [
                          'binaries',
                          'functionData'
                        ],
                        count: 1,
                        probability: 0.8,
                        unique: 1,
                        hasDuplicates: false,
                        values: [
                          '//8='
                        ],
                        bsonType: 'Binary'
                      }
                    ]
                  },
                  {
                    name: 'generic',
                    path: [
                      'binaries',
                      'generic'
                    ],
                    count: 1,
                    type: 'Binary',
                    probability: 0.8,
                    hasDuplicates: false,
                    types: [
                      {
                        name: 'Binary',
                        path: [
                          'binaries',
                          'generic'
                        ],
                        count: 1,
                        probability: 0.8,
                        unique: 1,
                        hasDuplicates: false,
                        values: [
                          'AQID'
                        ],
                        bsonType: 'Binary'
                      }
                    ]
                  },
                  {
                    name: 'md5',
                    path: [
                      'binaries',
                      'md5'
                    ],
                    count: 1,
                    type: 'Binary',
                    probability: 0.8,
                    hasDuplicates: false,
                    types: [
                      {
                        name: 'Binary',
                        path: [
                          'binaries',
                          'md5'
                        ],
                        count: 1,
                        probability: 0.8,
                        unique: 1,
                        hasDuplicates: false,
                        values: [
                          'c//SZESzTGmQ6OfR38A11A=='
                        ],
                        bsonType: 'Binary'
                      }
                    ]
                  },
                  {
                    name: 'uuid',
                    path: [
                      'binaries',
                      'uuid'
                    ],
                    count: 1,
                    type: 'Binary',
                    probability: 0.8,
                    hasDuplicates: false,
                    types: [
                      {
                        name: 'Binary',
                        path: [
                          'binaries',
                          'uuid'
                        ],
                        count: 1,
                        probability: 0.8,
                        unique: 1,
                        hasDuplicates: false,
                        values: [
                          'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'
                        ],
                        bsonType: 'Binary'
                      }
                    ]
                  },
                  {
                    name: 'uuidOld',
                    path: [
                      'binaries',
                      'uuidOld'
                    ],
                    count: 1,
                    type: 'Binary',
                    probability: 0.8,
                    hasDuplicates: false,
                    types: [
                      {
                        name: 'Binary',
                        path: [
                          'binaries',
                          'uuidOld'
                        ],
                        count: 1,
                        probability: 0.8,
                        unique: 1,
                        hasDuplicates: false,
                        values: [
                          'c//SZESzTGmQ6OfR38A11A=='
                        ],
                        bsonType: 'Binary'
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            name: 'binData',
            path: [
              'binData'
            ],
            count: 1,
            type: 'Binary',
            probability: 0.8,
            hasDuplicates: false,
            types: [
              {
                name: 'Binary',
                path: [
                  'binData'
                ],
                count: 1,
                probability: 0.8,
                unique: 1,
                hasDuplicates: false,
                values: [
                  'AQID'
                ],
                bsonType: 'Binary'
              }
            ]
          },
          {
            name: 'boolean',
            path: [
              'boolean'
            ],
            count: 1,
            type: 'Boolean',
            probability: 0.8,
            hasDuplicates: false,
            types: [
              {
                name: 'Boolean',
                path: [
                  'boolean'
                ],
                count: 1,
                probability: 0.8,
                unique: 1,
                hasDuplicates: false,
                values: [
                  true
                ],
                bsonType: 'Boolean'
              }
            ]
          },
          {
            name: 'date',
            path: [
              'date'
            ],
            count: 1,
            type: 'Date',
            probability: 0.8,
            hasDuplicates: false,
            types: [
              {
                name: 'Date',
                path: [
                  'date'
                ],
                count: 1,
                probability: 0.8,
                unique: 1,
                hasDuplicates: false,
                values: [
                  '2023-04-05T13:25:08.445Z'
                ],
                bsonType: 'Date'
              }
            ]
          },
          {
            name: 'dbRef',
            path: [
              'dbRef'
            ],
            count: 1,
            type: 'DBRef',
            probability: 0.8,
            hasDuplicates: false,
            types: [
              {
                name: 'DBRef',
                path: [
                  'dbRef'
                ],
                count: 1,
                probability: 0.8,
                unique: 1,
                hasDuplicates: false,
                values: [
                  {
                    $ref: 'namespace',
                    $id: '642d76b4b7ebfab15d3c4a78'
                  }
                ],
                bsonType: 'DBRef'
              }
            ]
          },
          {
            name: 'decimal',
            path: [
              'decimal'
            ],
            count: 1,
            type: 'Decimal128',
            probability: 0.8,
            hasDuplicates: false,
            types: [
              {
                name: 'Decimal128',
                path: [
                  'decimal'
                ],
                count: 1,
                probability: 0.8,
                unique: 1,
                hasDuplicates: false,
                values: [
                  {
                    $numberDecimal: '5.477284286264328586719275128128001E-4088'
                  }
                ],
                bsonType: 'Decimal128'
              }
            ]
          },
          {
            name: 'double',
            path: [
              'double'
            ],
            count: 1,
            type: 'Double',
            probability: 0.8,
            hasDuplicates: false,
            types: [
              {
                name: 'Double',
                path: [
                  'double'
                ],
                count: 1,
                probability: 0.8,
                unique: 1,
                hasDuplicates: false,
                values: [
                  1.2
                ],
                bsonType: 'Double'
              }
            ]
          },
          {
            name: 'int',
            path: [
              'int'
            ],
            count: 1,
            type: 'Int32',
            probability: 0.8,
            hasDuplicates: false,
            types: [
              {
                name: 'Int32',
                path: [
                  'int'
                ],
                count: 1,
                probability: 0.8,
                unique: 1,
                hasDuplicates: false,
                values: [
                  12345
                ],
                bsonType: 'Int32'
              }
            ]
          },
          {
            name: 'javascript',
            path: [
              'javascript'
            ],
            count: 1,
            type: 'Code',
            probability: 0.8,
            hasDuplicates: false,
            types: [
              {
                name: 'Code',
                path: [
                  'javascript'
                ],
                count: 1,
                probability: 0.8,
                unique: 1,
                hasDuplicates: false,
                values: [
                  {
                    code: 'function() {}'
                  }
                ],
                bsonType: 'Code'
              }
            ]
          },
          {
            name: 'javascriptWithScope',
            path: [
              'javascriptWithScope'
            ],
            count: 1,
            type: 'CodeWScope',
            probability: 0.8,
            hasDuplicates: false,
            types: [
              {
                name: 'CodeWScope',
                path: [
                  'javascriptWithScope'
                ],
                count: 1,
                probability: 0.8,
                unique: 1,
                hasDuplicates: false,
                values: [
                  {
                    code: 'function() {}',
                    scope: {
                      foo: 1,
                      bar: 'a'
                    }
                  }
                ],
                bsonType: 'CodeWScope'
              }
            ]
          },
          {
            name: 'long',
            path: [
              'long'
            ],
            count: 1,
            type: 'Long',
            probability: 0.8,
            hasDuplicates: false,
            types: [
              {
                name: 'Long',
                path: [
                  'long'
                ],
                count: 1,
                probability: 0.8,
                unique: 1,
                hasDuplicates: false,
                values: [
                  {
                    low: -1395630315,
                    high: 28744523,
                    unsigned: false
                  }
                ],
                bsonType: 'Long'
              }
            ]
          },
          {
            name: 'maxKey',
            path: [
              'maxKey'
            ],
            count: 1,
            type: 'MaxKey',
            probability: 0.8,
            hasDuplicates: false,
            types: [
              {
                name: 'MaxKey',
                path: [
                  'maxKey'
                ],
                count: 1,
                probability: 0.8,
                unique: 1,
                hasDuplicates: false,
                values: [
                  {}
                ],
                bsonType: 'MaxKey'
              }
            ]
          },
          {
            name: 'minKey',
            path: [
              'minKey'
            ],
            count: 1,
            type: 'MinKey',
            probability: 0.8,
            hasDuplicates: false,
            types: [
              {
                name: 'MinKey',
                path: [
                  'minKey'
                ],
                count: 1,
                probability: 0.8,
                unique: 1,
                hasDuplicates: false,
                values: [
                  {}
                ],
                bsonType: 'MinKey'
              }
            ]
          },
          {
            name: 'null',
            path: [
              'null'
            ],
            count: 1,
            type: 'Null',
            probability: 0.8,
            hasDuplicates: true,
            types: [
              {
                name: 'Null',
                path: [
                  'null'
                ],
                count: 1,
                probability: 0.8,
                unique: 1,
                hasDuplicates: true,
                bsonType: 'Null'
              }
            ]
          },
          {
            name: 'object',
            path: [
              'object'
            ],
            count: 1,
            type: 'Document',
            probability: 0.8,
            hasDuplicates: false,
            types: [
              {
                name: 'Document',
                path: [
                  'object'
                ],
                count: 1,
                probability: 0.8,
                bsonType: 'Document',
                fields: [
                  {
                    name: 'key',
                    path: [
                      'object',
                      'key'
                    ],
                    count: 1,
                    type: 'String',
                    probability: 0.8,
                    hasDuplicates: false,
                    types: [
                      {
                        name: 'String',
                        path: [
                          'object',
                          'key'
                        ],
                        count: 1,
                        probability: 0.8,
                        unique: 1,
                        hasDuplicates: false,
                        values: [
                          'value'
                        ],
                        bsonType: 'String'
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            name: 'objectId',
            path: [
              'objectId'
            ],
            count: 1,
            type: 'ObjectId',
            probability: 0.8,
            hasDuplicates: false,
            types: [
              {
                name: 'ObjectId',
                path: [
                  'objectId'
                ],
                count: 1,
                probability: 0.8,
                unique: 1,
                hasDuplicates: false,
                values: [
                  '642d766c7300158b1f22e975'
                ],
                bsonType: 'ObjectId'
              }
            ]
          },
          {
            name: 'regex',
            path: [
              'regex'
            ],
            count: 1,
            type: 'BSONRegExp',
            probability: 0.8,
            hasDuplicates: false,
            types: [
              {
                name: 'BSONRegExp',
                path: [
                  'regex'
                ],
                count: 1,
                probability: 0.8,
                unique: 1,
                hasDuplicates: false,
                values: [
                  {
                    pattern: 'pattern',
                    options: 'i'
                  }
                ],
                bsonType: 'BSONRegExp'
              }
            ]
          },
          {
            name: 'string',
            path: [
              'string'
            ],
            count: 1,
            type: 'String',
            probability: 0.8,
            hasDuplicates: false,
            types: [
              {
                name: 'String',
                path: [
                  'string'
                ],
                count: 1,
                probability: 0.8,
                unique: 1,
                hasDuplicates: false,
                values: [
                  'Hello, world!'
                ],
                bsonType: 'String'
              }
            ]
          },
          {
            name: 'symbol',
            path: [
              'symbol'
            ],
            count: 1,
            type: 'BSONSymbol',
            probability: 0.8,
            hasDuplicates: false,
            types: [
              {
                name: 'BSONSymbol',
                path: [
                  'symbol'
                ],
                count: 1,
                probability: 0.8,
                unique: 1,
                hasDuplicates: false,
                values: [
                  'symbol'
                ],
                bsonType: 'BSONSymbol'
              }
            ]
          },
          {
            name: 'timestamp',
            path: [
              'timestamp'
            ],
            count: 1,
            type: 'Timestamp',
            probability: 0.8,
            hasDuplicates: false,
            types: [
              {
                name: 'Timestamp',
                path: [
                  'timestamp'
                ],
                count: 1,
                probability: 0.8,
                unique: 1,
                hasDuplicates: false,
                values: [
                  {
                    $timestamp: '7218556297505931265'
                  }
                ],
                bsonType: 'Timestamp'
              }
            ]
          }
        ]
      };
      const standard = await convertInternalToStandard(internal);
      ajv.validateSchema(standard);
      const expectedDefinitions: any = {
        ...RELAXED_EJSON_DEFINITIONS
      };
      delete expectedDefinitions.Undefined;
      delete expectedDefinitions.DBPointer;
      assert.deepStrictEqual(standard, {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        required: [],
        $defs: expectedDefinitions,
        properties: {
          _id: {
            $ref: '#/$defs/ObjectId'
          },
          array: {
            type: 'array',
            items: {
              $ref: '#/$defs/Double'
            }
          },
          binData: {
            $ref: '#/$defs/Binary'
          },
          binaries: {
            type: 'object',
            properties: {
              binaryOld: {
                $ref: '#/$defs/Binary'
              },
              compressedTimeSeries: {
                $ref: '#/$defs/Binary'
              },
              custom: {
                $ref: '#/$defs/Binary'
              },
              encrypted: {
                $ref: '#/$defs/Binary'
              },
              functionData: {
                $ref: '#/$defs/Binary'
              },
              generic: {
                $ref: '#/$defs/Binary'
              },
              md5: {
                $ref: '#/$defs/Binary'
              },
              uuid: {
                $ref: '#/$defs/Binary'
              },
              uuidOld: {
                $ref: '#/$defs/Binary'
              }
            },
            required: []
          },
          boolean: {
            type: 'boolean'
          },
          date: {
            $ref: '#/$defs/Date'
          },
          dbRef: {
            $ref: '#/$defs/DBRef'
          },
          decimal: {
            $ref: '#/$defs/Decimal128'
          },
          double: {
            $ref: '#/$defs/Double'
          },
          int: {
            type: 'integer'
          },
          javascript: {
            $ref: '#/$defs/Code'
          },
          javascriptWithScope: {
            $ref: '#/$defs/CodeWScope'
          },
          long: {
            type: 'integer'
          },
          maxKey: {
            $ref: '#/$defs/MaxKey'
          },
          minKey: {
            $ref: '#/$defs/MinKey'
          },
          null: {
            type: 'null'
          },
          object: {
            type: 'object',
            properties: {
              key: {
                type: 'string'
              }
            },
            required: []
          },
          objectId: {
            $ref: '#/$defs/ObjectId'
          },
          regex: {
            $ref: '#/$defs/RegExp'
          },
          string: {
            type: 'string'
          },
          symbol: {
            $ref: '#/$defs/BSONSymbol'
          },
          timestamp: {
            $ref: '#/$defs/Timestamp'
          }
        }
      });
    });

    it('nested document/object', async function() {
      const internal = {
        count: 2,
        fields: [
          {
            name: 'author',
            path: [
              'author'
            ],
            count: 1,
            type: [
              'Document',
              'Undefined'
            ],
            probability: 1,
            hasDuplicates: false,
            types: [
              {
                name: 'Document',
                path: [
                  'author'
                ],
                count: 1,
                probability: 0.5,
                bsonType: 'Document',
                fields: [
                  {
                    name: 'name',
                    path: [
                      'author',
                      'name'
                    ],
                    count: 1,
                    type: 'String',
                    probability: 1,
                    hasDuplicates: false,
                    types: [
                      {
                        name: 'String',
                        path: [
                          'author',
                          'name'
                        ],
                        count: 1,
                        probability: 1,
                        unique: 1,
                        hasDuplicates: false,
                        values: [
                          'Peter Sonder'
                        ],
                        bsonType: 'String'
                      }
                    ]
                  },
                  {
                    name: 'rating',
                    path: [
                      'author',
                      'rating'
                    ],
                    count: 1,
                    type: 'Double',
                    probability: 1,
                    hasDuplicates: false,
                    types: [
                      {
                        name: 'Double',
                        path: [
                          'author',
                          'rating'
                        ],
                        count: 1,
                        probability: 1,
                        unique: 1,
                        hasDuplicates: false,
                        values: [
                          1.3
                        ],
                        bsonType: 'Double'
                      }
                    ]
                  }
                ]
              },
              {
                name: 'Undefined',
                bsonType: 'Undefined',
                unique: 1,
                hasDuplicates: false,
                path: [
                  'author'
                ],
                count: 1,
                probability: 0.5
              }
            ]
          }
        ]
      };
      const standard = await convertInternalToStandard(internal);
      const expectedDefinitions = {
        Double: RELAXED_EJSON_DEFINITIONS.Double
      };
      ajv.validateSchema(standard);
      assert.deepStrictEqual(standard, {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        required: ['author'],
        $defs: expectedDefinitions,
        properties: {
          author: {
            type: 'object',
            required: ['name', 'rating'],
            properties: {
              name: {
                type: 'string'
              },
              rating: {
                $ref: '#/$defs/Double'
              }
            }
          }
        }
      });
    });

    describe('arrays', async function() {
      it('array - single type', async function() {
        const internal = {
          count: 2,
          fields: [
            {
              name: 'genres',
              path: [
                'genres'
              ],
              count: 1,
              type: [
                'array',
                'Undefined'
              ],
              probability: 0.5,
              hasDuplicates: false,
              types: [
                {
                  name: 'array',
                  path: [
                    'genres'
                  ],
                  count: 1,
                  probability: 0.5,
                  bsonType: 'Array',
                  types: [
                    {
                      name: 'String',
                      path: [
                        'genres'
                      ],
                      count: 2,
                      probability: 1,
                      unique: 2,
                      hasDuplicates: false,
                      values: [
                        'crimi',
                        'comedy'
                      ],
                      bsonType: 'String'
                    }
                  ],
                  totalCount: 2,
                  lengths: [
                    2
                  ],
                  averageLength: 2
                },
                {
                  name: 'Undefined',
                  bsonType: 'Undefined',
                  unique: 1,
                  hasDuplicates: false,
                  path: [
                    'genres'
                  ],
                  count: 1,
                  probability: 0.5
                }
              ]
            }
          ]
        };
        const standard = await convertInternalToStandard(internal);
        ajv.validateSchema(standard);
        assert.deepStrictEqual(standard, {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          required: [],
          $defs: {},
          properties: {
            genres: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        });
      });

      it('array - complex mixed type', async function() {
        const internal = {
          count: 2,
          fields: [
            {
              name: 'genres',
              path: [
                'genres'
              ],
              count: 1,
              type: [
                'Array',
                'Undefined'
              ],
              probability: 0.5,
              hasDuplicates: false,
              types: [
                {
                  name: 'Array',
                  path: [
                    'genres'
                  ],
                  count: 1,
                  probability: 0.5,
                  bsonType: 'Array',
                  types: [
                    {
                      name: 'String',
                      path: [
                        'genres'
                      ],
                      count: 2,
                      probability: 0.6666666666666666,
                      unique: 2,
                      hasDuplicates: false,
                      values: [
                        'crimi',
                        'comedy'
                      ],
                      bsonType: 'String'
                    },
                    {
                      name: 'Document',
                      path: [
                        'genres'
                      ],
                      count: 1,
                      probability: 0.3333333333333333,
                      bsonType: 'Document',
                      fields: [
                        {
                          name: 'long',
                          path: [
                            'genres',
                            'long'
                          ],
                          count: 1,
                          type: 'String',
                          probability: 1,
                          hasDuplicates: false,
                          types: [
                            {
                              name: 'String',
                              path: [
                                'genres',
                                'long'
                              ],
                              count: 1,
                              probability: 1,
                              unique: 1,
                              hasDuplicates: false,
                              values: [
                                'science fiction'
                              ],
                              bsonType: 'String'
                            }
                          ]
                        },
                        {
                          name: 'short',
                          path: [
                            'genres',
                            'short'
                          ],
                          count: 1,
                          type: 'String',
                          probability: 1,
                          hasDuplicates: false,
                          types: [
                            {
                              name: 'String',
                              path: [
                                'genres',
                                'short'
                              ],
                              count: 1,
                              probability: 1,
                              unique: 1,
                              hasDuplicates: false,
                              values: [
                                'scifi'
                              ],
                              bsonType: 'String'
                            }
                          ]
                        }
                      ]
                    }
                  ],
                  totalCount: 3,
                  lengths: [
                    3
                  ],
                  averageLength: 3
                },
                {
                  name: 'Undefined',
                  bsonType: 'Undefined',
                  unique: 1,
                  hasDuplicates: false,
                  path: [
                    'genres'
                  ],
                  count: 1,
                  probability: 0.5
                }
              ]
            }
          ]
        };
        const standard = await convertInternalToStandard(internal);
        ajv.validateSchema(standard);
        assert.deepStrictEqual(standard, {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          required: [],
          $defs: {},
          properties: {
            genres: {
              type: 'array',
              items: {
                anyOf: [
                  {
                    type: 'string'
                  },
                  {
                    type: 'object',
                    required: ['long', 'short'],
                    properties: {
                      long: {
                        type: 'string'
                      },
                      short: {
                        type: 'string'
                      }
                    }
                  }
                ]
              }
            }
          }
        });
      });

      it('array - simple mixed type', async function() {
        const internal = {
          count: 2,
          fields: [
            {
              name: 'arrayMixedType',
              path: [
                'arrayMixedType'
              ],
              count: 1,
              type: 'Array',
              probability: 1,
              hasDuplicates: false,
              types: [
                {
                  name: 'Array',
                  path: [
                    'arrayMixedType'
                  ],
                  count: 1,
                  probability: 1,
                  bsonType: 'Array',
                  types: [
                    {
                      name: 'int32',
                      path: [
                        'arrayMixedType'
                      ],
                      count: 2,
                      probability: 0.6666666666666666,
                      unique: 2,
                      hasDuplicates: false,
                      values: [
                        1,
                        3
                      ],
                      bsonType: 'Int32'
                    },
                    {
                      name: 'String',
                      path: [
                        'arrayMixedType'
                      ],
                      count: 1,
                      probability: 0.3333333333333333,
                      unique: 1,
                      hasDuplicates: false,
                      values: [
                        '2'
                      ],
                      bsonType: 'String'
                    }
                  ],
                  totalCount: 3,
                  lengths: [
                    3
                  ],
                  averageLength: 3
                }
              ]
            }
          ]
        };
        const standard = await convertInternalToStandard(internal);
        ajv.validateSchema(standard);
        assert.deepStrictEqual(standard, {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          required: ['arrayMixedType'],
          $defs: {},
          properties: {
            arrayMixedType: {
              type: 'array',
              items: {
                type: ['integer', 'string']
              }
            }
          }
        });
      });
    });

    describe('mixed types', async function() {
      it('simple mixed type', async function() {
        const internal = {
          count: 2,
          fields: [
            {
              name: 'mixedType',
              path: [
                'mixedType'
              ],
              count: 2,
              type: [
                'Int32',
                'String',
                'Undefined'
              ],
              probability: 0.6666666666666666,
              hasDuplicates: false,
              types: [
                {
                  name: 'Int32',
                  path: [
                    'mixedType'
                  ],
                  count: 1,
                  probability: 0.3333333333333333,
                  unique: 1,
                  hasDuplicates: false,
                  values: [
                    1
                  ],
                  bsonType: 'Int32'
                },
                {
                  name: 'String',
                  path: [
                    'mixedType'
                  ],
                  count: 1,
                  probability: 0.3333333333333333,
                  unique: 1,
                  hasDuplicates: false,
                  values: [
                    'abc'
                  ],
                  bsonType: 'String'
                },
                {
                  name: 'Undefined',
                  bsonType: 'Undefined',
                  unique: 1,
                  hasDuplicates: false,
                  path: [
                    'mixedType'
                  ],
                  count: 1,
                  probability: 0.3333333333333333
                }
              ]
            }
          ]
        };
        const standard = await convertInternalToStandard(internal);
        ajv.validateSchema(standard);
        assert.deepStrictEqual(standard, {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          required: [],
          $defs: {},
          properties: {
            mixedType: {
              type: ['integer', 'string']
            }
          }
        });
      });

      it('complex mixed type (with array and object)', async function() {
        const internal = {
          count: 2,
          fields: [
            {
              name: 'mixedComplexType',
              path: [
                'mixedComplexType'
              ],
              count: 2,
              type: [
                'Array',
                'Document',
                'Undefined'
              ],
              probability: 0.6666666666666666,
              hasDuplicates: false,
              types: [
                {
                  name: 'Array',
                  path: [
                    'mixedComplexType'
                  ],
                  count: 1,
                  probability: 0.3333333333333333,
                  bsonType: 'Array',
                  types: [
                    {
                      name: 'Int32',
                      path: [
                        'mixedComplexType'
                      ],
                      count: 3,
                      probability: 1,
                      unique: 3,
                      hasDuplicates: false,
                      values: [
                        1,
                        2,
                        3
                      ],
                      bsonType: 'Int32'
                    }
                  ],
                  totalCount: 3,
                  lengths: [
                    3
                  ],
                  averageLength: 3
                },
                {
                  name: 'Document',
                  path: [
                    'mixedComplexType'
                  ],
                  count: 1,
                  probability: 0.3333333333333333,
                  bsonType: 'Document',
                  fields: [
                    {
                      name: 'a',
                      path: [
                        'mixedComplexType',
                        'a'
                      ],
                      count: 1,
                      type: 'String',
                      probability: 1,
                      hasDuplicates: false,
                      types: [
                        {
                          name: 'String',
                          path: [
                            'mixedComplexType',
                            'a'
                          ],
                          count: 1,
                          probability: 1,
                          unique: 1,
                          hasDuplicates: false,
                          values: [
                            'bc'
                          ],
                          bsonType: 'String'
                        }
                      ]
                    }
                  ]
                },
                {
                  name: 'Undefined',
                  bsonType: 'Undefined',
                  unique: 1,
                  hasDuplicates: false,
                  path: [
                    'mixedComplexType'
                  ],
                  count: 1,
                  probability: 0.3333333333333333
                }
              ]
            }
          ]
        };
        const standard = await convertInternalToStandard(internal);
        ajv.validateSchema(standard);
        assert.deepStrictEqual(standard, {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          required: [],
          $defs: {},
          properties: {
            mixedComplexType: {
              anyOf: [
                {
                  type: 'array',
                  items: {
                    type: 'integer'
                  }
                },
                {
                  type: 'object',
                  required: ['a'],
                  properties: {
                    a: {
                      type: 'string'
                    }
                  }
                }
              ]
            }
          }
        });
      });

      it('complex mixed type (with $refs)', async function() {
        const internal = {
          count: 2,
          fields: [
            {
              name: 'mixedType',
              path: [
                'mixedType'
              ],
              count: 2,
              type: [
                'String',
                'ObjectId'
              ],
              probability: 1,
              hasDuplicates: false,
              types: [
                {
                  name: 'String',
                  path: [
                    'mixedType'
                  ],
                  count: 1,
                  probability: 0.3333333333333333,
                  unique: 1,
                  hasDuplicates: false,
                  values: [
                    'abc'
                  ],
                  bsonType: 'String'
                },
                {
                  name: 'ObjectId',
                  path: [
                    'objectId'
                  ],
                  count: 1,
                  probability: 0.8,
                  unique: 1,
                  hasDuplicates: false,
                  values: [
                    '642d766c7300158b1f22e975'
                  ],
                  bsonType: 'ObjectId'
                }
              ]
            }
          ]
        };
        const standard = await convertInternalToStandard(internal);
        ajv.validateSchema(standard);
        const expectedDefinitions = {
          ObjectId: RELAXED_EJSON_DEFINITIONS.ObjectId
        };
        assert.deepStrictEqual(standard, {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          required: ['mixedType'],
          $defs: expectedDefinitions,
          properties: {
            mixedType: {
              anyOf: [{
                type: 'string'
              }, {
                $ref: '#/$defs/ObjectId'
              }]
            }
          }
        });
      });
    });

    it('can be aborted', async function() {
      const internal = {
        count: 2,
        fields: [
          {
            name: 'mixedComplexType',
            path: [
              'mixedComplexType'
            ],
            count: 2,
            type: [
              'Array',
              'Document',
              'Undefined'
            ],
            probability: 0.6666666666666666,
            hasDuplicates: false,
            types: [
              {
                name: 'Array',
                path: [
                  'mixedComplexType'
                ],
                count: 1,
                probability: 0.3333333333333333,
                bsonType: 'Array',
                types: [
                  {
                    name: 'Int32',
                    path: [
                      'mixedComplexType'
                    ],
                    count: 3,
                    probability: 1,
                    unique: 3,
                    hasDuplicates: false,
                    values: [
                      1,
                      2,
                      3
                    ],
                    bsonType: 'Int32'
                  }
                ],
                totalCount: 3,
                lengths: [
                  3
                ],
                averageLength: 3
              },
              {
                name: 'Document',
                path: [
                  'mixedComplexType'
                ],
                count: 1,
                probability: 0.3333333333333333,
                bsonType: 'Document',
                fields: [
                  {
                    name: 'a',
                    path: [
                      'mixedComplexType',
                      'a'
                    ],
                    count: 1,
                    type: 'String',
                    probability: 1,
                    hasDuplicates: false,
                    types: [
                      {
                        name: 'String',
                        path: [
                          'mixedComplexType',
                          'a'
                        ],
                        count: 1,
                        probability: 1,
                        unique: 1,
                        hasDuplicates: false,
                        values: [
                          'bc'
                        ],
                        bsonType: 'String'
                      }
                    ]
                  }
                ]
              },
              {
                name: 'Undefined',
                bsonType: 'Undefined',
                unique: 1,
                hasDuplicates: false,
                path: [
                  'mixedComplexType'
                ],
                count: 1,
                probability: 0.3333333333333333
              }
            ]
          }
        ]
      };
      const abortController = new AbortController();
      const promise = convertInternalToStandard(internal, { signal: abortController.signal });
      abortController.abort(new Error('Too long, didn\'t wait.'));
      await assert.rejects(promise, {
        name: 'Error',
        message: 'Too long, didn\'t wait.'
      });
    });
  });
});
