var ValueCollection = require('../lib/value-collection');
var NumberType = require('../lib/types').Number;
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
    ]);
  });

  it('should accept any type of value', function () {
    assert.deepEqual(collection.serialize(), [0, '', null, false, [], {}]);
    assert.equal(collection.length, 6);
  });

  it('should pass collection\'s parent down to the values', function () {
    var num = new NumberType(null);
    num.values.reset([
      {value: 250}
    ]);
    assert.equal(num.values.at(0).parent, num);
  });
});
