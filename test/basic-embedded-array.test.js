var getSchema = require('../');
var assert = require('assert');
var BSON = require('bson');
var _ = require('lodash');

/* eslint new-cap: 0, quote-props: 0, camelcase: 0 */
describe('basic embedded array', function() {
  var following_ids;
  var docs = [
    {
      _id: new BSON.ObjectID('55581e0a9bf712d0c2b48d71'),
      following_ids: [new BSON.ObjectID('55582407aafa8fbbc57196e2')]
    },
    {
      _id: new BSON.ObjectID('55582407aafa8fbbc57196e2'),
      following_ids: [
        new BSON.ObjectID('55581e0a9bf712d0c2b48d71'),
        '55581e0a9bf712d0c2b48d71'
      ]
    }
  ];

  before(function(done) {
    getSchema(docs, function(err, res) {
      assert.ifError(err);
      following_ids = _.find(
        _.find(res.fields, 'name', 'following_ids').types,
        'name',
        'Array'
      );
      done();
    });
  });

  it('should have 2 lengths for following_ids', function() {
    assert.deepEqual(following_ids.lengths, [1, 2]);
  });

  it('should have an average length of 1.5 for following_ids', function() {
    assert.equal(following_ids.average_length, 1.5);
  });

  it('should have a sum of probability for following_ids of 1', function() {
    assert.equal(_.sum(_.map(following_ids.types, 'probability')), 1);
  });

  it('should have 33% String for following_ids', function() {
    assert.equal(
      _.find(following_ids.types, 'name', 'String').probability,
      1 / 3
    );
  });

  it('should have 66% ObjectID for following_ids', function() {
    assert.equal(
      _.find(following_ids.types, 'name', 'ObjectID').probability,
      2 / 3
    );
  });
});
