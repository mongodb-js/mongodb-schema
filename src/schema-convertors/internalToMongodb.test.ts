import assert from 'assert';
import internalSchemaToStandard from './internalToMongodb';

describe.only('internalSchemaToStandard', function() {
  describe('Converts: ', function() {
    it('document/object', function() {
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
      const standard = internalSchemaToStandard(internal);
      assert.deepStrictEqual(standard, {
        bsonType: 'object',
        required: ['author'],
        properties: {
          author: {
            bsonType: 'object',
            required: ['name', 'rating'],
            properties: {
              name: {
                bsonType: 'string'
              },
              rating: {
                bsonType: 'double'
              }
            }
          }
        }
      });
    });

    it('array - single type', function() {
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
      const standard = internalSchemaToStandard(internal);
      assert.deepStrictEqual(standard, {
        bsonType: 'object',
        required: [],
        properties: {
          genres: {
            bsonType: 'array',
            items: {
              bsonType: 'string'
            }
          }
        }
      });
    });

    it('array - complex mixed type', function() {
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
      const standard = internalSchemaToStandard(internal);
      assert.deepStrictEqual(standard, {
        bsonType: 'object',
        required: [],
        properties: {
          genres: {
            bsonType: 'array',
            items: {
              anyOf: [
                {
                  bsonType: 'string'
                },
                {
                  bsonType: 'object',
                  required: ['long', 'short'],
                  properties: {
                    long: {
                      bsonType: 'string'
                    },
                    short: {
                      bsonType: 'string'
                    }
                  }
                }
              ]
            }
          }
        }
      });
    });

    // TODO: array - simple mixed type
  });
});
