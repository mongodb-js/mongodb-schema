var getSchema = require('../');
var assert = require('assert');
var _ = require('lodash');


describe('arrays and objects as type (INT-203 restructuring)', function () {
  var docs = [
    { x: [1, 2, 3] },
    { x: "foo" },
    { x: { b: 1 } },
    { x: [ "bar", null, false ] },
    { x: [ {c: 1, d: 1}, {c: 2 } ] },
    { e: 1 }
  ];

  var schema;

  before(function (done) {
    schema = getSchema('mixed.mess', docs, done);
  });

  describe('Field', function () {
    var x;

    before(function () {
      x = schema.fields.get('x');
    });

    it('have the right type distribution of x', function() {
      var dist = _.zipObject(
        x.types.pluck('name'),
        x.types.pluck('probability')
      );
      assert.deepEqual(dist, {
        'Array': 3/6,
        'String': 1/6,
        'Document': 1/6,
        'Undefined': 1/6
      });
    });

    it('should have an `.fields` alias for convenience', function() {
      assert.deepEqual(x.fields, x.types.get('Document').fields);
    });
  });


  describe('Nested Array', function () {
    var arr;

    before(function () {
      arr = schema.fields.get('x').types.get('Array');
    });

    it('should return the lengths of all encountered arrays', function() {
      assert.deepEqual(arr.lengths, [3, 3, 2]);
    });

    it('should return the probability of x being an array', function(){
      assert.equal(arr.probability, 3/6);
    });

    it('should return the total count of all containing values', function() {
      assert.equal(arr.total_count, 8);
    });

    it('should return the type distribution inside an array', function () {
      var arrDist = _.zipObject(
        arr.types.pluck('name'),
        arr.types.pluck('probability')
      );
      assert.deepEqual(arrDist, {
        'Number': 3/8,
        'String': 1/8,
        'Null': 1/8,
        'Boolean': 1/8,
        'Document': 2/8
      });
    });

    it('should have a `.fields` alias for convenience', function () {
      assert.deepEqual(arr.fields, arr.types.get('Document').fields);
    });

  });

});
