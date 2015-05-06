// var defs = require('./definitions');
var pkg = require('../package.json');
var find = require('lodash.find');
var BSON = require('bson');
var isInteger = require('is-integer');
var each = require('lodash.foreach');
var stream = require('stream');
var debug = require('debug')('mongodb-schema');

// these types have a _bsontype property
var bsontypeMap = {
  'ObjectID': 7,
  'Long': 18,
  'MinKey': 255,
  'MaxKey': 127,
  'Code': 15, // no differentiation to 13
  'Binary': 5,
  'DBRef': 12,
  'Timestamp': 17
};


/**
 * return the bson type of `value`
 * @param  {any}     value    value to get the type for
 * @return {number}           bson type as decimal number
 */
function _getType(value) {
  if (typeof value === 'number') {
    // could be int (16) or float (1)
    return isInteger(value) ? 16 : 1;
  }

  if (typeof value === 'string') {
    // could be symbol (14, deprecated) or string (2), assume string
    return 2;
  }

  if (typeof value === 'boolean') {
    return 8;
  }

  if (value === null) {
    return 10;
  }

  if (typeof value === 'object') {
    // could be embedded document (3), array (4), binary (5), objectid (7),
    // datetime (9), regular expression (11), dbref (12), code (13),
    // code with scope (15), timestamp (17), minkey (255), maxkey (127).

    if (value.hasOwnProperty('_bsontype')) {
      // objectid, dbref, binary, code, code with scope, timestamp, maxkey, minkey
      return bsontypeMap[value._bsontype];
    }

    if (value instanceof Array) {
      return 4;
    }

    if (value instanceof Date) {
      return 9;
    }

    if (value instanceof RegExp) {
      return 11;
    }

    // if nothing matches, it's a nested document
    return 3;
  }

  // should not get here
  throw Error('invalid type');
}



function _pushValue(value, data_obj) {
  if (!data_obj.hasOwnProperty('values')) {
    data_obj.values = [];
  }
  data_obj.values.push(value);
}

function _addToSet(value, data_obj) {

}


function _aggregate(name, value, type, data_obj) {

  switch (type) {
    case 1: _pushValue(value, data_obj); break;
    case 2: _pushValue(value, data_obj); break;
    case 3: break;
    // ...

  }

  if (type === 1) {  // float
    _pushValue(value, data_obj);
  }

  if (type === 2) {
    // @todo
  }
}

function _finalize(schema) {

}

/**
 * analyse property and integrate it into the schema
 * @param  {array}   documents   array of sample documents to integrate into schema
 * @return {object}              resulting schema
 */
function _infer(obj, schema) {

  for (var name in obj) {
    if (!obj.hasOwnProperty(name)) continue;

    var value = obj[name];

    // create schema member if not present yet
    if (!(name in schema)) {
      schema[name] = {};
      schema[name][defs.ESCAPE + defs.SCHEMA] = [];
    }
    var tag = schema[name][defs.ESCAPE + defs.SCHEMA];

    // get type of `value`
    var bsontype = _getType(value);

    // find schema array element for correct type or create one
    // @review  should this be an object rather than array? at least while building the schema?
    var type_obj = find(tag, function (el) {
      return el[defs.TYPE] === bsontype;
    });

    if (!type_obj) {
      // not found, create one
      type_obj = {};
      type_obj[defs.TYPE] = bsontype;
      type_obj[defs.COUNT] = 0;
      type_obj[defs.PROB] = 0.0;
      type_obj[defs.UNIQUE] = null;           // should be determined at the end
      type_obj[defs.DATA] = {};

      tag.push(type_obj);
    }

    // increase counts, add data, check uniqueness
    type_obj[defs.COUNT] += 1;
    _aggregate(name, value, bsontype, type_obj[defs.DATA]);

    // special handling for arrays (type 4)

    // recursive call for nested documents (type 3)
    if (bsontype === 3) {
      _infer(value, schema[name]);
    }
  }
}

/**
 * main schema function
 * @param  {array}   documents   array of sample documents to integrate into schema
 * @return {object}              resulting schema
 */
module.exports = function(documents) {
  var schema = {};

  // @todo: see above on moving this to a class.

  // add root tag and version
  var root = defs.ESCAPE + defs.ROOT;
  schema[root] = {};
  schema[root][defs.VERSION] = pkg.version;
  schema[root][defs.COUNT] = 0;

  // ensure `documents` is array or undefined
  if (documents === undefined) {
    documents = [];
  }

  if (!(documents instanceof Array)) {
    throw new TypeError('`documents` must be an array.');
  }
  // @todo: finish cleanup
  // walk all documents
  each(documents, function inspect_document(doc) {
    // increase global counter
    schema[root][defs.COUNT] += 1;
    _infer(doc, schema);
  });
  return schema;
};
