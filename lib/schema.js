var es = require('event-stream');
var _ = require('lodash');
var DocumentType = require('./types').Document;
var State = require('ampersand-state');
var FieldCollection = require('./field-collection');

// var debug = require('debug')('mongodb-schema:schema');

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
  return branchArray;
};

/**
 * The top level schema document, like a Document type
 * but with extra stream interface.
 */
var Schema = State.extend({
  idAttribute: 'ns',
  props: {
    ns: {
      type: 'string'
    },
    name: {
      type: 'string',
      default: 'Schema'
    },
    count: {
      type: 'number',
      default: 0
    }
  },
  derived: {
    width: {
      cache: false,
      fn: function() {
        return widthRecursive(this);
      }
    },
    depth: {
      cache: false,
      fn: function() {
        return depthRecursive(this);
      }
    },
    branchingFactors: {
      cache: false,
      fn: function() {
        return _.sortBy(branchingFactors(this)).reverse();
      }
    }
  },
  collections: {
    fields: FieldCollection
  },
  analyze: function(obj) {
    return DocumentType.prototype.analyze.call(this, obj);
  },
  stream: function() {
    var model = this;
    return es.map(function(doc, done) {
      model.analyze(doc);
      done(null, doc);
    });
  },
  parse: function(attrs) {
    return attrs;
  },
  serialize: function() {
    var res = this.getAttributes({
      props: true,
      derived: false
    }, true);
    res = _.omit(res, ['name']);
    res.fields = this.fields.serialize();
    return res;
  }
});

module.exports = Schema;
