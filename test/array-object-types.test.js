var getSchema = require('../');
var assert = require('assert');

/* eslint quote-props: 0 */
describe('arrays and objects as type (INT-203 restructuring)', function() {
  var docs = [
    {
      x: [1, 2, 3]
    },
    {
      x: 'foo'
    },
    {
      x: {
        b: 1
      }
    },
    {
      x: ['bar', null, false]
    },
    {
      x: [{
        c: 1,
        d: 1
      }, {
        c: 2
      }]
    },
    {
      e: 1
    }
  ];
  var schema;
  before(function(done) {
    getSchema(docs, function(err, res) {
      assert.ifError(err);
      schema = res;
      done();
    });
  });
  describe('Field', function() {
    var x;
    before(function() {
      x = schema.fields.find(v => v.name === 'x');
    });
    it('have the right type distribution of x', function() {
      var names = x.types.map(v => v.name);
      var probabilities = x.types.map( v=> v.probability);
      var dist = names.reduce((p, c, i) => ({...p, [c]: probabilities[i]}), {});
      assert.deepEqual(dist, {
        'Array': 3 / 6,
        'String': 1 / 6,
        'Document': 1 / 6,
        'Undefined': 1 / 6
      });
    });
  });

  describe('Nested Array', function() {
    var arr;

    before(function() {
      var types = schema.fields.find(v => v.name === 'x').types;
      arr = types.find(v => v.name === 'Array');
    });

    it('should return the lengths of all encountered arrays', function() {
      assert.deepEqual(arr.lengths, [3, 3, 2]);
    });

    it('should return the probability of x being an array', function() {
      assert.equal(arr.probability, 3 / 6);
    });

    it('should return the total count of all containing values', function() {
      assert.equal(arr.total_count, 8);
    });

    it('should return the type distribution inside an array', function() {
      var names = arr.types.map(v => v.name);
      var probabilities = arr.types.map( v=> v.probability);
      var arrDist = names.reduce((p, c, i) => ({...p, [c]: probabilities[i]}), {});
      assert.deepEqual(arrDist, {
        'Number': 3 / 8,
        'String': 1 / 8,
        'Null': 1 / 8,
        'Boolean': 1 / 8,
        'Document': 2 / 8
      });
    });
  });
});
