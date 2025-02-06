import assert from 'assert';

import { getSimplifiedSchema } from '../src';
import type { SimplifiedSchema } from '../src/schema-analyzer';
import { allBSONTypesDoc } from './all-bson-types-fixture';

const docsFixture = [
  {
    foo: 1,
    bar: 25
  },
  {
    foo: 2,
    bar: 'test',
    baz: true
  },
  {
    foo: 3,
    bar: 'another test'
  },
  allBSONTypesDoc
];

const expected = {
  _id: {
    types: [{
      bsonType: 'ObjectId'
    }]
  },
  double: {
    types: [{
      bsonType: 'Double'
    }]
  },
  string: {
    types: [{
      bsonType: 'String'
    }]
  },
  object: {
    types: [{
      bsonType: 'Document',
      fields: {
        key: {
          types: [{
            bsonType: 'String'
          }]
        }
      }
    }]
  },
  array: {
    types: [{
      bsonType: 'Array',
      types: [{
        bsonType: 'Number'
      }]
    }]
  },
  binData: {
    types: [{
      bsonType: 'Binary'
    }]
  },
  objectId: {
    types: [{
      bsonType: 'ObjectId'
    }]
  },
  boolean: {
    types: [{
      bsonType: 'Boolean'
    }]
  },
  date: {
    types: [{
      bsonType: 'Date'
    }]
  },
  null: {
    types: [{
      bsonType: 'Null'
    }]
  },
  regex: {
    types: [{
      bsonType: 'BSONRegExp'
    }]
  },
  javascript: {
    types: [{
      bsonType: 'Code'
    }]
  },
  symbol: {
    types: [{
      bsonType: 'BSONSymbol'
    }]
  },
  javascriptWithScope: {
    types: [{
      bsonType: 'CodeWScope'
    }]
  },
  int: {
    types: [{
      bsonType: 'Int32'
    }]
  },
  timestamp: {
    types: [{
      bsonType: 'Timestamp'
    }]
  },
  long: {
    types: [{
      bsonType: 'Long'
    }]
  },
  decimal: {
    types: [{
      bsonType: 'Decimal128'
    }]
  },
  minKey: {
    types: [{
      bsonType: 'MinKey'
    }]
  },
  maxKey: {
    types: [{
      bsonType: 'MaxKey'
    }]
  },

  binaries: {
    types: [{
      bsonType: 'Document',
      fields: {
        generic: {
          types: [{
            bsonType: 'Binary'
          }]
        },
        functionData: {
          types: [{
            bsonType: 'Binary'
          }]
        },
        binaryOld: {
          types: [{
            bsonType: 'Binary'
          }]
        },
        uuidOld: {
          types: [{
            bsonType: 'Binary'
          }]
        },
        uuid: {
          types: [{
            bsonType: 'Binary'
          }]
        },
        md5: {
          types: [{
            bsonType: 'Binary'
          }]
        },
        encrypted: {
          types: [{
            bsonType: 'Binary'
          }]
        },
        compressedTimeSeries: {
          types: [{
            bsonType: 'Binary'
          }]
        },
        custom: {
          types: [{
            bsonType: 'Binary'
          }]
        }
      }
    }]
  },
  dbRef: {
    types: [{
      bsonType: 'DBRef'
    }]
  },
  foo: {
    types: [{
      bsonType: 'Number'
    }]
  },
  bar: {
    types: [{
      bsonType: 'String'
    }, {
      bsonType: 'Number'
    }]
  },
  baz: {
    types: [{
      bsonType: 'Boolean'
    }]
  }
};

describe('simplified schema', function() {
  let schema: SimplifiedSchema;

  before(async function() {
    schema = await getSimplifiedSchema(docsFixture);
  });

  it('should assemble a simplified schema', function() {
    assert.deepEqual(schema, expected);
  });

  it('contains all of the types', function() {
    const fieldTypes = [
      'Array',
      'Binary',
      'Boolean',
      'Code',
      'Date',
      'Decimal128',
      'Double',
      'Int32',
      'Long',
      'MaxKey',
      'MinKey',
      'Null',
      'Document',
      'ObjectId',
      'BSONRegExp',
      'String',
      'BSONSymbol',
      'Timestamp'
    ];

    for (const fieldType of fieldTypes) {
      assert.equal(
        !!Object.values(schema).find(schemaType => schemaType.types.find(schemaType => schemaType.bsonType === fieldType)),
        true,
        `Cannot find type "${fieldType}" in schemaField types: ${JSON.stringify(schema.fields, null, 2)}`
      );
    }
  });
});
