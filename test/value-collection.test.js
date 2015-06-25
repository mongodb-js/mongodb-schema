var ValueCollection = require('../lib/value-collection');
var _ = require('lodash');
var assert = require('assert');
var debug = require('debug')('mongodb-schema:test:value-collection');

describe('ValueCollection', function () {
  var collection;
  before(function () {
    collection = new ValueCollection([
      {value: 0},
      {value: ""},
      {value: null},
      {value: false},
      {value: []},
      {value: {}}
    ], {parse: true});
  })
  it('should accept any type of value', function () {
    assert.deepEqual(collection.serialize(), [0, '', null, false, [], {}]);
    assert.equal(collection.length, 6);
  });
});
