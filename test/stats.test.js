var getSchema = require('../');
var assert = require('assert');

/* eslint quote-props: 0 */
describe('schema statistics', function() {
  describe('empty doc', function() {
    var docs = [
      {}
    ];
    var schema;
    before(function(done) {
      schema = getSchema('mixed.mess', docs, done);
    });
    it('should have the correct schema width', function() {
      assert.equal(schema.width, 0);
    });
    it('should have the correct schema depth', function() {
      assert.equal(schema.depth, 0);
    });
  });
  describe('doc with one key', function() {
    var docs = [
      {
        foo: 'bar'
      }
    ];
    var schema;
    before(function(done) {
      schema = getSchema('mixed.mess', docs, done);
    });
    it('should have the correct schema width', function() {
      assert.equal(schema.width, 1);
    });
    it('should have the correct schema depth', function() {
      assert.equal(schema.depth, 1);
    });
  });
  describe('example 1', function() {
    var docs = [
      {
        one: [
          'foo',
          'bar',
          {
            two: {
              three: 3
            }
          },
          'baz'
        ],
        foo: 'bar'
      }
    ];
    var schema;
    before(function(done) {
      schema = getSchema('mixed.mess', docs, done);
    });
    it('should have the correct schema width', function() {
      assert.equal(schema.width, 4);
    });
    it('should have the correct schema depth', function() {
      assert.equal(schema.depth, 3);
    });
  });
  describe('example 2', function() {
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
      schema = getSchema('mixed.mess', docs, done);
    });
    it('should have the correct schema width', function() {
      assert.equal(schema.width, 5);
    });
    it('should have the correct schema depth', function() {
      assert.equal(schema.depth, 2);
    });
  });
  describe('example 3', function() {
    var docs = [
      {
        a: 1,
        b: false,
        one: {
          c: null,
          two: {
            three: {
              four: 4,
              e: 'deepest nesting level'
            }
          }
        },
        f: {
          g: 'not the deepest level'
        }
      }
    ];
    var schema;
    before(function(done) {
      schema = getSchema('mixed.mess', docs, done);
    });
    it('should have the correct schema width', function() {
      assert.equal(schema.width, 10);
    });
    it('should have the correct schema depth', function() {
      assert.equal(schema.depth, 4);
    });
  });
  describe('example 4', function() {
    var docs = [
      {
        a: {
          b: [{
            c: {
              d: [{
                e: {
                  f: [{
                    g: [1, 2, 3]
                  }]
                }
              }]
            }
          }]
        }
      }
    ];
    var schema;
    before(function(done) {
      schema = getSchema('mixed.mess', docs, done);
    });
    it('should have the correct schema width', function() {
      assert.equal(schema.width, 7);
    });
    it('should have the correct schema depth', function() {
      assert.equal(schema.depth, 7);
    });
  });
});
