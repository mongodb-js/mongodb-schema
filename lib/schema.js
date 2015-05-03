var pkg = require('../package.json'),
    find = require('lodash.find'),
    defs = require('./definitions'),
    BSON = require('bson'),
    isInteger = require('is-integer'),
    debug = require('debug')('schema:main');


// these types have a _bsontype property
var bsontypeMap = {
  'ObjectID': 7,
  'Long': 18,
  'MinKey': 255,
  'MaxKey': 127,
  'Code': 15,      // no differentiation to 13
  'Binary': 5,
  'DBRef': 12,
  'Timestamp': 17
}


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
      // dbref, binary, code, code with scope, timestamp, maxkey, minkey
      return bsontypeMap[value._bsontype];
    }

    if (value instanceof BSON.ObjectId) {
      return 7;
    }

    return 3;
  }

}



/**
 * analyse property and integrate it into the schema
 * @param  {array}   documents   array of sample documents to integrate into schema
 * @return {object}              resulting schema
 */
function _infer(schema, name, value) {

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
    type_obj[defs.UNIQUE] = true;
    type_obj[defs.DATA] = {};

    tag.push(type_obj);
  }

  // increase counts, add data, check uniqueness
  type_obj[defs.COUNT] += 1;
  // @todo add data, verify still unique

  // special handling for arrays (type 4)

  // recursive call for nested documents (type 3)
  if (bsontype === 3) {
    for (var subname in value) {
      if (!value.hasOwnProperty(subname)) continue;
      _infer(schema[name], subname, value[subname]);
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

  // walk all documents
  documents.forEach(function (doc) {

    // increase global counter
    schema[root][defs.COUNT] += 1;

    for (var name in doc) {
      if (!doc.hasOwnProperty(name)) continue;

      // process this property
      _infer(schema, name, doc[name]);



    }

  });

  return schema;
}

