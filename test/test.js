var schema = require('../');
var assert = require('assert');
var BSON = require('bson');


describe('mongodb-schema', function() {
  describe('value type detection', function() {
    it('should identify ObjectIDs', function() {
      assert.equal(schema.getType(BSON.ObjectID()), 'ObjectID');
    });

    it('should identify booleans', function() {
      assert.equal(schema.getType(false), 'Boolean');
      assert.equal(schema.getType(true), 'Boolean');
    });
    it('should identify numbers', function() {
      assert.equal(schema.getType(1), 'Number');
      assert.equal(schema.getType(0), 'Number');
    });

    it('should identify nulls', function() {
      assert.equal(schema.getType(null), 'Null');
    });
    it('should identify undefineds', function() {
      assert.equal(schema.getType(undefined), 'Undefined');
    });
    it('should identify strings', function() {
      assert.equal(schema.getType('Brian'), 'String');
    });
    it('should identify dates', function() {
      assert.equal(schema.getType(new Date()), 'Date');
    });
    it('should identify arrays', function() {
      assert.equal(schema.getType([]), 'Array');
    });
    it('should identify objects', function() {
      assert.equal(schema.getType({}), 'Object');
    });
    it('should identify regexes', function() {
      assert.equal(schema.getType(new RegExp('\d')), 'RegExp');
    });
  });
});

