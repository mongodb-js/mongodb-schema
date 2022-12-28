import assert from 'assert';
import BSON from 'bson';

import getSchema from '../src';
import type { ArraySchemaType } from '../src/stream';

describe('basic embedded array', function() {
  let followingIds: ArraySchemaType;
  const docs = [
    {
      _id: new BSON.ObjectID('55581e0a9bf712d0c2b48d71'),
      followingIds: [new BSON.ObjectID('55582407aafa8fbbc57196e2')]
    },
    {
      _id: new BSON.ObjectID('55582407aafa8fbbc57196e2'),
      followingIds: [
        new BSON.ObjectID('55581e0a9bf712d0c2b48d71'),
        '55581e0a9bf712d0c2b48d71'
      ]
    }
  ];

  before(async function() {
    const res = await getSchema(docs);
    const types = res.fields.find(v => v.name === 'followingIds')?.types;
    followingIds = types?.find(v => v.name === 'Array') as ArraySchemaType;
  });

  it('should have 2 lengths for followingIds', function() {
    assert.deepEqual(followingIds.lengths, [1, 2]);
  });

  it('should have an average length of 1.5 for followingIds', function() {
    assert.equal(followingIds.average_length, 1.5);
  });

  it('should have a sum of probability for followingIds of 1', function() {
    const expectedSum = followingIds.types
      .map(v => v.probability)
      .reduce((p, c) => p + c || 0, 0);
    assert.equal(expectedSum, 1);
  });

  it('should have 33% String for followingIds', function() {
    assert.equal(followingIds.types.find(v => v.name === 'String')?.probability, 1 / 3);
  });

  it('should have 66% ObjectID for followingIds', function() {
    assert.equal(followingIds.types.find(v => v.name === 'ObjectID')?.probability, 2 / 3);
  });
});