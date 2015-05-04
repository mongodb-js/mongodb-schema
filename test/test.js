var schema = require('../lib/schema');
var defs = require('../lib/definitions');
var assert = require('assert');
var allTypes = require('../fixtures/all_types');
var BSON = require('bson');
var find = require('lodash.find');
var pkg = require('../package.json');

describe('mongodb-schema', function() {
  var root = defs.ESCAPE + defs.ROOT;

  it('should import correctly', function() {
    assert.ok(schema);
  });

  it('should have a root object with the correct version', function() {
    var result = schema();
    assert.ok(result[root] !== undefined);
    assert.equal(result[root][defs.VERSION], pkg.version);
  });

  it('should have 0 count without any documents', function() {
    var result = schema([]);
    assert.equal(result[root][defs.COUNT], 0);
  });

  it('should throw an error if documents is not an array or undefined', function() {
    assert.throws(function() {
      schema('i\'m not an array');
    }, TypeError);
    assert.doesNotThrow(function() {
      schema();
    });
  });

  it('should parse documents of all types without error', function() {
    assert.ok(schema(allTypes));
  });

  it('should compute probabilities correctly for root and nested levels', function() {
    var result = schema([
      {},
      {
        a: 'foo'
      },
      {
        a: 1,
        b: {
          c: BSON.ObjectId(),
          d: 1
        }
      },
      {
        a: 2,
        b: {
          d: 9
        }
      }
    ]);

    console.log(JSON.stringify(result, null, 2));

    assert.equal(result[root][defs.COUNT], 4);

    // a / string
    var aStrType = find(result.a[defs.ESCAPE + defs.SCHEMA], function(el) {
      return el[defs.TYPE] === 2;
    });
    assert.equal(aStrType[defs.COUNT], 1);
    assert.equal(aStrType[defs.PROB], 0.25);

    // a / int
    var aIntType = find(result.a[defs.ESCAPE + defs.SCHEMA], function(el) {
      return el[defs.TYPE] === 16;
    });
    assert.equal(aIntType[defs.COUNT], 2);
    assert.equal(aIntType[defs.PROB], 0.5);

    // b.d / int
    var bdIntType = find(result.b.d[defs.ESCAPE + defs.SCHEMA], function(el) {
      return el[defs.TYPE] === 16;
    });
    assert.equal(bdIntType[defs.COUNT], 2);
    assert.equal(bdIntType[defs.PROB], 1.0);
  });


});

