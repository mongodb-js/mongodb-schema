var _ = require('lodash');

var widthRecursive = function(schema) {
  var width = 0;
  if (!schema) {
    return width;
  }
  if (schema.fields !== undefined) {
    width += schema.fields.length;
    width += _.sum(schema.fields.map(function(field) {
      return widthRecursive(field);
    }));
  }
  if (schema.arrayFields !== undefined) {
    width += schema.arrayFields.length;
    width += _.sum(schema.arrayFields.map(function(field) {
      return widthRecursive(field);
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
    maxChildDepth = 1 + Math.max(0, _.max(schema.fields.map(function(field) {
        return depthRecursive(field);
      })));
  }
  if (schema.arrayFields !== undefined && schema.arrayFields.length > 0) {
    maxChildDepth = Math.max(maxChildDepth, 1
      + Math.max(0, _.max(schema.arrayFields.map(function(field) {
        return depthRecursive(field);
      }))));
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
      return branchingFactors(field);
    });
    branchArray.push.apply(branchArray, _.flatten(res, true));
  }
  if (schema.arrayFields !== undefined && schema.arrayFields.length > 0) {
    branchArray.push(schema.arrayFields.length);
    res = schema.arrayFields.map(function(field) {
      return branchingFactors(field);
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
