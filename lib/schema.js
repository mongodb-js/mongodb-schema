var pkg = require('../package.json');
var defs = require('./definitions');
var isInteger = require('is-integer');
var _ = require('lodash');
var math = require('mathjs');
// var debug = require('debug')('schema:main');
// var stream = require('stream');

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
  // could be int (16) or float (1)
  if (typeof value === 'number') return isInteger(value) ? 16 : 1;
  if (typeof value === 'string') return 2;
  if (typeof value === 'boolean') return 8;
  if (value === null) return 10;

  if (typeof value === 'object') {
    // could be embedded document (3), array (4), binary (5), objectid (7),
    // datetime (9), regular expression (11), dbref (12), code (13),
    // code with scope (15), timestamp (17), minkey (255), maxkey (127).

    // objectid, dbref, binary, code, code with scope, timestamp, maxkey, minkey
    if (value.hasOwnProperty('_bsontype')) return bsontypeMap[value._bsontype];
    if (value instanceof Array) return 4;
    if (value instanceof Date) return 9;
    if (value instanceof RegExp) return 11;

    // if nothing matches, it's a nested document
    return 3;
  }
  // should not get here
  throw new Error('invalid type');
}

/**
 * data helper: ensure .values array exists and push value into array
 * @param  {any} value          value to push to array
 * @param  {object} data_obj    object to update
 */
function _pushValue(value, data_obj) {
  if (!data_obj.hasOwnProperty('values')) {
    data_obj.values = [];
  }
  data_obj.values.push(value);
}

/**
 * data helper: ensure .values object exists and increase counter for value
 * @param  {any} value          value to push to array
 * @param  {object} data_obj    object to update
 */
function _countValue(value, data_obj) {
  if (!data_obj.hasOwnProperty('values')) {
    data_obj.values = {};
  }
  data_obj.values[value] = data_obj.values[value] + 1 || 1;
}

/**
 * aggregate data of a single member, different for each type
 * @param  {string} name     member name, e.g. "_id"
 * @param  {any} value       value of the member
 * @param  {integer} type    bsontype in decimal
 * @param  {object} data_obj the object to update
 */
function _aggregate(name, value, type, data_obj) {

  switch (type) {
    case 1: _pushValue(value, data_obj); break;     // float
    case 2: _countValue(value, data_obj); break;    // string
    case 8: _countValue(value, data_obj); break;    // boolean
    case 16: _countValue(value, data_obj); break;   // int-32
    // ...
    default: break;
  }
}

/**
 * finalize function that calculates all probabilties given the count
 * and parent count.
 * @param  {object} schema    schema to update
 */
function _finalizeProbabilities(schema) {
  var rootName = defs.ESCAPE + defs.ROOT;
  var schemaName = defs.ESCAPE + defs.SCHEMA;
  var parentCount;

  if (schema[rootName]) {
    parentCount = schema[rootName][defs.COUNT];
  } else {
    var type_3_doc = _.find(schema[schemaName], function(el) {
      return el[defs.TYPE] === 3;
    });
    if (type_3_doc) {
      parentCount = type_3_doc[defs.COUNT];
    } else {
      // no sub-documents counted, return
      return;
    }
  }

  for (var name in schema) {
    if (!schema.hasOwnProperty(name)) continue;
    if (name.charAt(0) === defs.ESCAPE) continue;

    var tag = schema[name][schemaName];
    _.each(tag, function(t) {
      // update the probability for each type inside the tag
      t[defs.PROB] = t[defs.COUNT] / parentCount;
    });

    // update children recursively
    _finalizeProbabilities(schema[name]);
  }
}


/**
 * compute statistics of data object and attaches .min, .max, .avg to the same object
 * @param  {object} data  data object, expects "data.values" present
 */
function _calcStats(data) {
  var values = data.values;

  data.min = math.min(values);
  data.max = math.max(values);
  data.avg = math.mean(values);
  // data.med = math.median(values);   // bug in mathjs: changes values sort order, see https://github.com/josdejong/mathjs/issues/309
}


/**
 * finalize function to transform the intermediate type objects to
 * their final shape.
 * @param  {object} schema    schema to update
 */
function _finalizeTypes(schema) {

  var schemaName = defs.ESCAPE + defs.SCHEMA;

  for (var name in schema) {
    if (!schema.hasOwnProperty(name)) continue;
    if (schema[name].hasOwnProperty(schemaName)) {
      var tag = schema[name][schemaName];
      _.each(tag, function(el) {
        var type = el[defs.TYPE];
        switch (type) {
          case 1:  // float
            var values = el[defs.DATA].values;

            el[defs.DATA].min = math.min(values);
            el[defs.DATA].max = math.max(values);
            el[defs.DATA].avg = math.mean(values);
            // el[defs.DATA].med = math.median(values);   // bug in mathjs: changes values sort order, see https://github.com/josdejong/mathjs/issues/309
            break;

          case 2:  // string
            var stats = _.unzip(_.sortBy(_.pairs(el[defs.DATA].values), function(pair) {
              // sort by counts descending
              return -pair[1];
            }));
            el[defs.DATA].values = stats[0];
            el[defs.DATA].counts = stats[1];
            break;

          case 3: break;

          case 8:  // boolean
            // var values = el[defs.DATA].values;



        }
      });
    }
  }
}

/**
 * wrapper for all steps that need to run at the end of schema generation
 * @param  {objet} schema    the intermediate schema
 */
function _finalize(schema) {
  _finalizeProbabilities(schema);
  _finalizeTypes(schema);
}

/**
 * main schema inference function: analyse an object and update the schema
 * @param  {object} object   single object to inspect
 * @param  {object} schema   schema object to update
 * @return {object}          resulting schema after update
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
    var type_obj = _.find(tag, function(el) {
      return el[defs.TYPE] === bsontype;
    });

    if (!type_obj) {
      // not found, create one
      type_obj = {};
      type_obj[defs.TYPE] = bsontype;
      type_obj[defs.COUNT] = 0;
      type_obj[defs.PROB] = 0.0;
      type_obj[defs.UNIQUE] = null; // should be determined at the end
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

  // walk all documents, count and infer
  _.each(documents, function(doc) {
    schema[root][defs.COUNT] += 1;
    _infer(doc, schema);
  });

  _finalize(schema);
  return schema;
};

// var inherits = require('util').inherits;

// function SchemaTransformStream( /* opts */ ) {
//   SchemaTransformStream._super.call(this, {
//     objectMode: true
//   });
// }

// inherits(SchemaTransformStream, stream.Transform);

// SchemaTransformStream.prototype._transform = function(document, encoding, done) {
//   debug('_transform: %j', {
//     encoding: encoding,
//     document: document
//   });
//   done();
// };

// module.exports.stream = SchemaTransformStream;

