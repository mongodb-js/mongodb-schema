// var debug = require('debug')('mongodb-schema:stats');

var widthRecursive = function(schema) {
  var width = 0;
  if (!schema) {
    return width;
  }
  if (schema.fields !== undefined) {
    width += schema.fields.length;
   
    width += schema.fields.map(field => {
     var doc = field.types.find(v => v.name === 'Document');
     return widthRecursive(doc);
   }).reduce((p, c) => p + c || 0, 0)


    width += schema.fields.map(field => {
      var arr = field.types.find(v => v.name === 'Array');
      if (arr) {
        var doc = arr.types.find(v => v.name === 'Document');
        return widthRecursive(doc);
      }
    })
    .reduce((p, c) => p + c || 0, 0);
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
      Math.max(...schema.fields.map(field => {
        var doc = field.types.find(v => v.name === 'Document');
        return depthRecursive(doc);
      })),
      Math.max(...schema.fields.map(field => {
        var arr = field.types.find(v => v.name === 'Array');
        if (arr) {
          var doc = arr.types.find(v => v.name === 'Document');
          return depthRecursive(doc);
        }
        return 0;
      }))
    )
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
      var doc = field.types.find(v => v.name === 'Document');
      return branchingFactors(doc);
    });
    branchArray.push(...res.flat(Infinity))
    res = schema.fields.map(function(field) {
      var arr = field.types.find(v => v.name === 'Array');
      if (arr) {
        var doc = arr.types.find(v => v.name === 'Document');
        return branchingFactors(doc);
      }
      return [];
    });
    branchArray.push(...res.flat(Infinity))
  }
  return branchArray.sort().reverse();
};

module.exports = {
  width: widthRecursive,
  depth: depthRecursive,
  branch: branchingFactors
};
