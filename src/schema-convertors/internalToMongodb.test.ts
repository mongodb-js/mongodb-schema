import assert from 'assert';
import internalSchemaToStandard from './internalToMongodb';

describe.only('internalSchemaToStandard', function() {
  it('converts a document/object', function() {
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
      $jsonSchema: {
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
      }
    });
  });

  it('converts an array', function() {
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
      $jsonSchema: {
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
      }
    });
  });
});
