var getSchema = require('../');
var assert = require('assert');
var BSON = require('bson');

// var debug = require('debug')('mongodb-schema:test:options');

/* eslint new-cap: 0, quote-props: 0, no-new: 0, camelcase: 0 */
describe('options', function() {
  var docs = [
    {
      '_id': new BSON.ObjectID('55581e0a9bf712d0c2b48d71'),
      'email': 'tick@duck.org',
      'shape': {
        type: 'Point',
        coordinates: [20.0, 30.0]
      },
      'is_verified': false
    },
    {
      '_id': new BSON.ObjectID('55581e0a9bf712d0c2b48d72'),
      'email': 'trick@duck.org',
      'shape': {
        type: 'LineString',
        coordinates: [[20.0, 30.0], [30.0, 40.0]]
      },
      'is_verified': false
    },
    {
      '_id': new BSON.ObjectID('55581e0a9bf712d0c2b48d73'),
      'email': 'track@duck.org',
      'shape': {
        'type': 'Polygon',
        'coordinates': [[[20.0, 30.0], [30.0, 40.0], [15.0, 50.0], [20.0, 30.0]]]
      },
      'is_verified': true
    }
  ];

  var schema;
  context('when using default options', function() {
    beforeEach(function(done) {
      getSchema(docs, function(err, res) {
        assert.ifError(err);
        schema = res;
        done();
      });
    });

    it('stores values by default', function() {
      assert.equal(schema.fields[0].types[0].values.length, 3);
    });

    it('does not use semantic type detection', function() {
      assert.equal(schema.fields.find(v => v.name === 'email').types[0].name, 'String');
      assert.equal(schema.fields.find(v => v.name === 'email').types[0].bsonType, 'String');
      assert.equal(schema.fields.find(v => v.name === 'shape').types[0].name, 'Document');
      assert.equal(schema.fields.find(v => v.name === 'shape').types[0].bsonType, 'Document');
    });
  });

  context('when `storeValues` is false', function() {
    beforeEach(function(done) {
      getSchema(docs, {storeValues: false}, function(err, res) {
        assert.ifError(err);
        schema = res;
        done();
      });
    });
    it('does not store values when `storeValues` is false', function() {
      assert.ok(!schema.fields[0].types[0].values);
    });
  });

  context('when `semanticTypes` is true', function() {
    beforeEach(function(done) {
      getSchema(docs, {semanticTypes: true}, function(err, res) {
        assert.ifError(err);
        schema = res;
        done();
      });
    });
    it('calls semantic type detection', function() {
      assert.equal(schema.fields.find(v => v.name === 'email').types[0].name, 'Email');
      assert.equal(schema.fields.find(v => v.name === 'email').types[0].bsonType, 'String');
    });
  });
  context('when `semanticTypes` is an object', function() {
    context('and all values are boolean', function() {
      beforeEach(function(done) {
        getSchema(docs, {semanticTypes: {email: true}}, function(err, res) {
          assert.ifError(err);
          schema = res;
          done();
        });
      });
      it('only uses the enabled type detectors', function() {
        assert.equal(schema.fields.find(v => v.name === 'email').types[0].name, 'Email');
        assert.equal(schema.fields.find(v => v.name === 'email').types[0].bsonType, 'String');
      });
    });
    context('and values are mixed upper/lower case', function() {
      beforeEach(function(done) {
        getSchema(docs, {semanticTypes: {eMaIl: true}}, function(err, res) {
          assert.ifError(err);
          schema = res;
          done();
        });
      });
      it('uses the enabled type detectors', function() {
        assert.equal(schema.fields.find(v => v.name === 'email').types[0].name, 'Email');
        assert.equal(schema.fields.find(v => v.name === 'email').types[0].bsonType, 'String');
      });
    });

    context('and all values are custom detector functions', function() {
      beforeEach(function(done) {
        getSchema(docs, {semanticTypes: {Verification: function(value, key) {
          return key.match(/verified/);
        }}}, function(err, res) {
          assert.ifError(err);
          schema = res;
          done();
        });
      });
      it('uses the custom type detectors', function() {
        assert.equal(schema.fields.find(v => v.name === 'is_verified').types[0].name, 'Verification');
        assert.equal(schema.fields.find(v => v.name === 'is_verified').types[0].bsonType, 'Boolean');
        assert.equal(schema.fields.find(v => v.name === 'email').types[0].name, 'String');
        assert.equal(schema.fields.find(v => v.name === 'email').types[0].bsonType, 'String');
      });
    });

    context('and values are mixed booleans and custom detector functions', function() {
      beforeEach(function(done) {
        getSchema(docs, {semanticTypes: {email: true, Verification: function(value, key) {
          return key.match(/verified/);
        }}}, function(err, res) {
          assert.ifError(err);
          schema = res;
          done();
        });
      });
      it('uses the enabled and custom type detectors', function() {
        assert.equal(schema.fields.find(v => v.name === 'is_verified').types[0].name, 'Verification');
        assert.equal(schema.fields.find(v => v.name === 'is_verified').types[0].bsonType, 'Boolean');
        assert.equal(schema.fields.find(v => v.name === 'email').types[0].name, 'Email');
        assert.equal(schema.fields.find(v => v.name === 'email').types[0].bsonType, 'String');
      });
    });
  });
});
