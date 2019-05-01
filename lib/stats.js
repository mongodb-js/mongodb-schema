var _ = require('lodash');
// var debug = require('debug')('mongodb-schema:stats');

var widthRecursive = function(schema) {
  var width = 0;
  if (!schema) {
    return width;
  }
  if (schema.fields !== undefined) {
    width += schema.fields.length;
    width += _.sum(schema.fields.map(function(field) {
      var doc = _.find(field.types, 'name', 'Document');
      return widthRecursive(doc);
    }));
    width += _.sum(schema.fields.map(function(field) {
      var arr = _.find(field.types, 'name', 'Array');
      if (arr) {
        var doc = _.find(arr.types, 'name', 'Document');
        return widthRecursive(doc);
      }
    }));
  }
  return width;
};

var depthRecursive = function(schema) {
  if (!schema) {
    return 0;
  }
  var maxChildDepth = 0;
  if (schema.fields !== undefined && schema.fields.length > 0) {
    maxChildDepth = 1 + Math.max(
      _.max(schema.fields.map(function(field) {
        var doc = _.find(field.types, 'name', 'Document');
        return depthRecursive(doc);
      })),
      _.max(schema.fields.map(function(field) {
        var arr = _.find(field.types, 'name', 'Array');
        if (arr) {
          var doc = _.find(arr.types, 'name', 'Document');
          return depthRecursive(doc);
        }
        return 0;
      })));
  }
  return maxChildDepth;
};

var branchingFactors = function(schema) {
  var branchArray = [];
  var res;
  if (!schema) {
    return branchArray;
  }
  if (schema.fields !== undefined && schema.fields.length > 0) {
    branchArray.push(schema.fields.length);
    res = schema.fields.map(function(field) {
      var doc = _.find(field.types, 'name', 'Document');
      return branchingFactors(doc);
    });
    branchArray.push.apply(branchArray, _.flatten(res, true));
    res = schema.fields.map(function(field) {
      var arr = _.find(field.types, 'name', 'Array');
      if (arr) {
        var doc = _.find(arr.types, 'name', 'Document');
        return branchingFactors(doc);
      }
      return [];
    });
    branchArray.push.apply(branchArray, _.flatten(res, true));
  }
  return _.sortBy(branchArray).reverse();
};

module.exports = {
  width: widthRecursive,
  depth: depthRecursive,
  branch: branchingFactors
};
