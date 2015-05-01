var pkg = require('../package.json'),
    find = require('lodash.find'),
    defs = require('./definitions');



/**
 * return the bson type of `value`
 * @param  {any}     value    value to get the type for
 * @return {number}           bson type as decimal number
 */
function _getType(value) {
  // @todo return correct type
  return 0;
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

  // get type of `value`
  var type = _getType(value);

  // find schema array element for correct type or create one
  // @review  should this be an object rather than array? at least while building it?
  var type_obj = find(schema[name], function (el) {
    return el[defs.TYPE] === type;
  });

  // increase counts, add data


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

