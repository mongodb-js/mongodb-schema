import assert from 'assert';
import { RELAXED_EJSON_DEFINITIONS } from './internalToStandard';
import { convertInternalToExpanded } from './internalToExpanded';

describe('internalSchemaToExpanded', async function() {
  describe('Converts: ', async function() {
    it('various types', async function() {
      const internal = {
        count: 1,
        fields: [
          // types with ref
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
          // type with different standard and bsonType
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
      const expanded = await convertInternalToExpanded(internal);
      const expectedDefinitions: Partial<typeof RELAXED_EJSON_DEFINITIONS> = { ...RELAXED_EJSON_DEFINITIONS };
      delete expectedDefinitions.BSONSymbol;
      delete expectedDefinitions.CodeWScope;
      delete expectedDefinitions.DBPointer;
      delete expectedDefinitions.DBRef;
      delete expectedDefinitions.Date;
      delete expectedDefinitions.MinKey;
      delete expectedDefinitions.Undefined;
      assert.deepStrictEqual(expanded, {
        type: 'object',
        'x-bsonType': 'object',
        required: [],
        $defs: expectedDefinitions,
        properties: {
          _id: {
            $ref: '#/$defs/ObjectId',
            'x-bsonType': 'objectId',
            'x-metadata': {
              count: 1,
              hasDuplicates: false,
              probability: 0.8
            },
            'x-sampleValues': [
              '642d766b7300158b1f22e972'
            ]
          },
          binData: {
            $ref: '#/$defs/Binary',
            'x-bsonType': 'binData',
            'x-metadata': {
              count: 1,
              hasDuplicates: false,
              probability: 0.8
            },
            'x-sampleValues': [
              'AQID'
            ]
          },
          binaries: {
            type: 'object',
            'x-bsonType': 'object',
            'x-metadata': {
              count: 1,
              hasDuplicates: false,
              probability: 0.8
            },
            properties: {
              binaryOld: {
                $ref: '#/$defs/Binary',
                'x-bsonType': 'binData',
                'x-metadata': {
                  count: 1,
                  hasDuplicates: false,
                  probability: 0.8
                },
                'x-sampleValues': [
                  '//8='
                ]
              }
            },
            required: []
          },
          boolean: {
            type: 'boolean',
            'x-bsonType': 'bool',
            'x-metadata': {
              count: 1,
              hasDuplicates: false,
              probability: 0.8
            },
            'x-sampleValues': [
              true
            ]
          },
          decimal: {
            $ref: '#/$defs/Decimal128',
            'x-bsonType': 'decimal',
            'x-metadata': {
              count: 1,
              hasDuplicates: false,
              probability: 0.8
            },
            'x-sampleValues': [{
              $numberDecimal: '5.477284286264328586719275128128001E-4088'
            }]
          },
          double: {
            $ref: '#/$defs/Double',
            'x-bsonType': 'double',
            'x-metadata': {
              count: 1,
              hasDuplicates: false,
              probability: 0.8
            },
            'x-sampleValues': [
              1.2
            ]
          },
          javascript: {
            $ref: '#/$defs/Code',
            'x-bsonType': 'javascript',
            'x-metadata': {
              count: 1,
              hasDuplicates: false,
              probability: 0.8
            },
            'x-sampleValues': [{
              code: 'function() {}'
            }]
          },
          long: {
            type: 'integer',
            'x-bsonType': 'long',
            'x-metadata': {
              count: 1,
              hasDuplicates: false,
              probability: 0.8
            },
            'x-sampleValues': [{
              low: -1395630315,
              high: 28744523,
              unsigned: false
            }]
          },
          maxKey: {
            $ref: '#/$defs/MaxKey',
            'x-bsonType': 'maxKey',
            'x-metadata': {
              count: 1,
              hasDuplicates: false,
              probability: 0.8
            },
            'x-sampleValues': [
              {}
            ]
          },
          regex: {
            $ref: '#/$defs/RegExp',
            'x-bsonType': 'regex',
            'x-metadata': {
              count: 1,
              hasDuplicates: false,
              probability: 0.8
            },
            'x-sampleValues': [{
              options: 'i',
              pattern: 'pattern'
            }]
          },
          timestamp: {
            $ref: '#/$defs/Timestamp',
            'x-bsonType': 'timestamp',
            'x-metadata': {
              count: 1,
              hasDuplicates: false,
              probability: 0.8
            },
            'x-sampleValues': [{
              $timestamp: '7218556297505931265'
            }]
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
      const expanded = await convertInternalToExpanded(internal);
      const expectedDefinitions = {
        Double: RELAXED_EJSON_DEFINITIONS.Double
      };
      assert.deepStrictEqual(expanded, {
        type: 'object',
        'x-bsonType': 'object',
        required: ['author'],
        $defs: expectedDefinitions,
        properties: {
          author: {
            type: 'object',
            'x-bsonType': 'object',
            'x-metadata': {
              count: 1,
              hasDuplicates: false,
              probability: 1
            },
            required: ['name', 'rating'],
            properties: {
              name: {
                type: 'string',
                'x-bsonType': 'string',
                'x-metadata': {
                  count: 1,
                  hasDuplicates: false,
                  probability: 1
                },
                'x-sampleValues': [
                  'Peter Sonder'
                ]
              },
              rating: {
                $ref: '#/$defs/Double',
                'x-bsonType': 'double',
                'x-metadata': {
                  count: 1,
                  hasDuplicates: false,
                  probability: 1
                },
                'x-sampleValues': [
                  1.3
                ]
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
        const expanded = await convertInternalToExpanded(internal);
        assert.deepStrictEqual(expanded, {
          type: 'object',
          'x-bsonType': 'object',
          required: [],
          $defs: {},
          properties: {
            genres: {
              type: 'array',
              'x-bsonType': 'array',
              'x-metadata': {
                probability: 0.5,
                hasDuplicates: false,
                count: 1
              },
              items: {
                type: 'string',
                'x-bsonType': 'string',
                'x-metadata': {
                  count: 2,
                  probability: 1,
                  hasDuplicates: false
                },
                'x-sampleValues': [
                  'crimi',
                  'comedy'
                ]
              }
            }
          }
        });
      });

      it('array - mixed type', async function() {
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
        const expanded = await convertInternalToExpanded(internal);
        assert.deepStrictEqual(expanded, {
          type: 'object',
          'x-bsonType': 'object',
          required: [],
          $defs: {},
          properties: {
            genres: {
              type: 'array',
              'x-bsonType': 'array',
              'x-metadata': {
                probability: 0.5,
                hasDuplicates: false,
                count: 1
              },
              items: {
                anyOf: [
                  {
                    type: 'string',
                    'x-bsonType': 'string',
                    'x-metadata': {
                      count: 2,
                      probability: 0.6666666666666666,
                      hasDuplicates: false
                    },
                    'x-sampleValues': [
                      'crimi',
                      'comedy'
                    ]
                  },
                  {
                    type: 'object',
                    'x-bsonType': 'object',
                    'x-metadata': {
                      count: 1,
                      probability: 0.3333333333333333
                    },
                    required: ['long', 'short'],
                    properties: {
                      long: {
                        type: 'string',
                        'x-bsonType': 'string',
                        'x-metadata': {
                          count: 1,
                          probability: 1,
                          hasDuplicates: false
                        },
                        'x-sampleValues': [
                          'science fiction'
                        ]
                      },
                      short: {
                        type: 'string',
                        'x-bsonType': 'string',
                        'x-metadata': {
                          count: 1,
                          probability: 1,
                          hasDuplicates: false
                        },
                        'x-sampleValues': [
                          'scifi'
                        ]
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
        const expanded = await convertInternalToExpanded(internal);
        assert.deepStrictEqual(expanded, {
          type: 'object',
          'x-bsonType': 'object',
          required: ['arrayMixedType'],
          $defs: {},
          properties: {
            arrayMixedType: {
              type: 'array',
              'x-bsonType': 'array',
              'x-metadata': {
                count: 1,
                probability: 1,
                hasDuplicates: false
              },
              items: {
                anyOf: [{
                  type: 'integer',
                  'x-bsonType': 'int',
                  'x-metadata': {
                    count: 2,
                    hasDuplicates: false,
                    probability: 0.6666666666666666
                  },
                  'x-sampleValues': [
                    1,
                    3
                  ]
                }, {
                  type: 'string',
                  'x-bsonType': 'string',
                  'x-metadata': {
                    count: 1,
                    hasDuplicates: false,
                    probability: 0.3333333333333333
                  },
                  'x-sampleValues': [
                    '2'
                  ]
                }]
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
        const expanded = await convertInternalToExpanded(internal);
        assert.deepStrictEqual(expanded, {
          type: 'object',
          'x-bsonType': 'object',
          required: [],
          $defs: {},
          properties: {
            mixedType: {
              'x-metadata': {
                probability: 0.6666666666666666,
                hasDuplicates: false,
                count: 2
              },
              anyOf: [{
                type: 'integer',
                'x-bsonType': 'int',
                'x-metadata': {
                  probability: 0.3333333333333333,
                  hasDuplicates: false,
                  count: 1
                },
                'x-sampleValues': [1]
              }, {
                type: 'string',
                'x-bsonType': 'string',
                'x-metadata': {
                  probability: 0.3333333333333333,
                  hasDuplicates: false,
                  count: 1
                },
                'x-sampleValues': ['abc']
              }]
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
        const expanded = await convertInternalToExpanded(internal);
        assert.deepStrictEqual(expanded, {
          type: 'object',
          'x-bsonType': 'object',
          required: [],
          $defs: {},
          properties: {
            mixedComplexType: {
              'x-metadata': {
                probability: 0.6666666666666666,
                hasDuplicates: false,
                count: 2
              },
              anyOf: [
                {
                  type: 'array',
                  'x-bsonType': 'array',
                  'x-metadata': {
                    count: 1,
                    probability: 0.3333333333333333
                  },
                  items: {
                    type: 'integer',
                    'x-bsonType': 'int',
                    'x-metadata': {
                      probability: 1,
                      hasDuplicates: false,
                      count: 3
                    },
                    'x-sampleValues': [1, 2, 3]
                  }
                },
                {
                  type: 'object',
                  'x-bsonType': 'object',
                  required: ['a'],
                  'x-metadata': {
                    count: 1,
                    probability: 0.3333333333333333
                  },
                  properties: {
                    a: {
                      type: 'string',
                      'x-bsonType': 'string',
                      'x-metadata': {
                        probability: 1,
                        hasDuplicates: false,
                        count: 1
                      },
                      'x-sampleValues': ['bc']
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
        const expanded = await convertInternalToExpanded(internal);
        const expectedDefinitions = {
          ObjectId: RELAXED_EJSON_DEFINITIONS.ObjectId
        };
        assert.deepStrictEqual(expanded, {
          type: 'object',
          'x-bsonType': 'object',
          required: ['mixedType'],
          $defs: expectedDefinitions,
          properties: {
            mixedType: {
              'x-metadata': {
                count: 2,
                hasDuplicates: false,
                probability: 1
              },
              anyOf: [{
                type: 'string',
                'x-bsonType': 'string',
                'x-metadata': {
                  count: 1,
                  hasDuplicates: false,
                  probability: 0.3333333333333333
                },
                'x-sampleValues': [
                  'abc'
                ]
              }, {
                $ref: '#/$defs/ObjectId',
                'x-bsonType': 'objectId',
                'x-metadata': {
                  count: 1,
                  hasDuplicates: false,
                  probability: 0.8
                },
                'x-sampleValues': [
                  '642d766c7300158b1f22e975'
                ]
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
      const promise = convertInternalToExpanded(internal, { signal: abortController.signal });
      abortController.abort(new Error('Too long, didn\'t wait.'));
      await assert.rejects(promise, {
        name: 'Error',
        message: 'Too long, didn\'t wait.'
      });
    });
  });
});
