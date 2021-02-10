var es = require('event-stream');
var Reservoir = require('reservoir');
var defaultsDeep = require('./utils/defaults-deep');
// var debug = require('debug')('mongodb-schema:stream');


/**
* extracts a Javascript string from a BSON type to compute unique values.
*
* @param {Any} value     value to be converted to a string
* @return {String}       converted value
*/
var extractStringValueFromBSON = function(value) {
  if (value && value._bsontype) {
    if (['Decimal128', 'Long'].includes(value._bsontype)) {
      return value.toString();
    }
    if ([ 'Double', 'Int32' ].includes(value._bsontype)) {
      return String(value.value);
    }
  }
  if (typeof value === 'string') {
    return value;
  }
  return String(value);
};

function fieldComparator(a, b) {
  // make sure _id is always at top, even in presence of uppercase fields
  var aName = a.name;
  var bName = b.name;
  if (aName === '_id') {
    return -1;
  }
  if (bName === '_id') {
    return 1;
  }
  // otherwise sort case-insensitively
  return aName.toLowerCase() < bName.toLowerCase() ? -1 : 1;
}

/**
 * final pass through the result to add missing information:
 *   - compute `probability`, `unique`, `has_duplicates` and
 *     `average_length` fields
 *   - add `Undefined` pseudo-types
 *   - collapse `type` arrays to single string if length 1
 *   - turns fields and types objects into arrays to conform with original
 *     schema parser
 *
 * @param  {Object} schema  current object to process, initially the root schema
 * @param  {Object} parent  parent node of schema, initially undefined
 * @param  {String} tag     a label to keep track of the kind of object to
 *                          process, either `fields` or `types`. Initially
 *                          undefined.
 *
 * @return {Object} data    objects from mapper to be reduced to single object.
 */
var finalizeSchema = function(schema, parent, tag) {
  if (schema === undefined) {
    return schema;
  }

  if (tag === undefined) {
    // recursively finalize fields
    // debug('recursively calling schema.fields');
    finalizeSchema(schema.fields, schema, 'fields');
  }
  if (tag === 'fields') {
    Object.values(schema).forEach((field) => {
      // create `Undefined` pseudo-type
      var missing = parent.count - field.count;
      if (missing > 0) {
        field.types.Undefined = {
          name: 'Undefined',
          type: 'Undefined',
          path: field.path,
          count: missing
        };
      }
      field.total_count = Object.values(field.types)
      .map(v => v.count)
      .reduce((p, c) => p + c, 0)

      // recursively finalize types
      finalizeSchema(field.types, field, 'types');
      field.type = field.types.map(v => v.name);
      if (field.type.length === 1) {
        field.type = field.type[0];
      }
      // a field has duplicates when any of its types have duplicates
      field.has_duplicates = !!field.types.find(v => v['has_duplicates']);
      // compute probability
      field.probability = field.count / parent.count;
    })
    // turn object into array
    parent.fields = Object.values(parent.fields).sort(fieldComparator);
  }
  if (tag === 'types') {
    Object.values(schema).forEach(type => {
      type.total_count = (type.lengths ?? []).reduce((p, c) => p + c || 0, 0);
      // debug('recursively calling schema.fields');
      finalizeSchema(type.fields, type, 'fields');
      // debug('recursively calling schema.types');
      finalizeSchema(type.types, type, 'types');
      // compute `probability` for each type
      type.probability = type.count / (parent.total_count || parent.count);
      // compute `unique` and `has_duplicates` for each type
      if (type.name === 'Null' || type.name === 'Undefined') {
        delete type.values;
        type.unique = type.count === 0 ? 0 : 1;
        type.has_duplicates = type.count > 1;
      } else if (type.values) {
        type.unique = new Set(type.values.map(extractStringValueFromBSON)).size
        type.has_duplicates = type.unique !== type.values.length;
      }
      // compute `average_length` for array types
      if (type.lengths) {
        type.average_length = type.total_count / type.lengths.length;
      }
      // recursively finalize fields and types
    })
    parent.types = Object.values(parent.types).sort((a, b) => b.probability - a.probability);
  }
  return schema;
};

/**
 * wraps finalizeSchema inside an event-stream map function (synchronous)
 */

/**
 * main entry point for schema parsing.
 *
 * @param {Object}          options                options (optional)
 * @param {Boolean}         options.storeValues    enable storing of values (default: true)
 * @param {Boolean|Object}  options.semanticTypes  enable semantic type detection (default: false)
 *                             to enable/disable all semantic types, use true/false.
 *                             to enable some semantic types, use object notation
 *                             with lowercase keys and truthy values:
 *                             `{email: true, geojson: true}` will only use email and
 *                             GeoJSON detection.
 *
 * @return {Stream}  The parser through tream
 */
module.exports = function parse(options) {
  /* eslint no-sync: 0 */

  // set default options
  options = {
    semanticTypes: false,
    storeValues: true,
  ...options}
  
  var semanticTypes = require('./semantic-types');

  if (typeof options.semanticTypes === 'object') {
    // enable existing types that evaluate to true
    var enabledTypes = Object.entries(options.semanticTypes)
    .filter(([k, v]) => typeof v === 'boolean' && v)
    .map(([k]) => k.toLowerCase());

    semanticTypes = {...
      Object.entries(semanticTypes)
      .filter(([k, v]) => enabledTypes.includes(k.toLowerCase()))
      .reduce((p, [k, v], i) => ({...p, [k]: v}), {}),
    }

    Object.entries(options.semanticTypes)
    .filter(([k, v]) => typeof v === 'function')
    .forEach(([k, v]) => semanticTypes[k] = v);
  }

  var rootSchema = {
    fields: {},
    count: 0
  };

  var finalized = false;
  var addToField;

  /**
   * Returns the type of value as a string. BSON type aware. Replaces `Object`
   * with `Document` to avoid naming conflicts with javascript Objects.
   *
   * @param  {Any} value   value for which to get the type
   * @param  {Any} path    path (in dot notation) for which to get the type
   * @return {String}      type as string, e.g. `ObjectId`, `Document`, `Date`,
   *                       `Number`, `Undefined`, `Boolean`, ...
   */
  var getBSONType = function(value) {
    var T;
    if (value && value._bsontype) {
      T = value._bsontype;
    } else {
      T = Object.prototype.toString.call(value).replace(/\[object (\w+)\]/, '$1');
    }
    if (T === 'Object') {
      T = 'Document';
    }
    return T;
  };

  var getSemanticType = function(value, path) {
    // pass value to semantic type detectors, return first match or undefined

    const returnValue = Object.entries(semanticTypes)
    .filter(([k, v]) => {
      return v(value, path)
    })
    .map(([k]) => k)[0];
    return returnValue;
  };

  /**
   * handles adding the value to the value reservoir. Will also crop
   * strings at 10,000 characters.
   *
   * @param {Object} type    the type object from `addToType`
   * @param {Any}    value   the value to be added to `type.values`
   */
  var addToValue = function(type, value) {
    if (type.name === 'String') {
      // crop strings at 10k characters
      if (value.length > 10000) {
        value = value.slice(0, 10000);
      }
    }
    type.values.pushSome(value);
  };

  /**
   * Takes a field value, determines the correct type, handles recursion into
   * nested arrays and documents, and passes the value down to `addToValue`.
   *
   * @param {String}  path     field path in dot notation
   * @param {Any}     value    value of the field
   * @param {Object}  schema   the updated schema object
   */

  var addToType = function(path, value, schema) {
    var bsonType = getBSONType(value);
    // if semantic type detection is enabled, the type is the semantic type
    // or the original bson type if no semantic type was detected. If disabled,
    // it is always the bson type.
    var typeName = (options.semanticTypes) ?
      getSemanticType(value, path) || bsonType : bsonType;
    var type = schema[typeName] = (schema || {})[typeName] || {
      name: typeName,
      bsonType: bsonType,
      path: path,
      count: 0
    }
    type.count++;
    // recurse into arrays by calling `addToType` for each element
    if (typeName === 'Array') {
      type.types = type.types || {};
      type.lengths = type.lengths || [];
      type.lengths.push(value.length);
      value.forEach(v => addToType(path, v, type.types))

    // recurse into nested documents by calling `addToField` for all sub-fields
    } else if (typeName === 'Document') {
      type.fields = type?.fields || {};
      Object.entries(value).forEach(([k, v]) => addToField(path + '.' + k, v, type.fields))

    // if the `storeValues` option is enabled, store some example values
    } else if (options.storeValues) {
      var defaultValue = bsonType === 'String' ?
      new Reservoir(100) : new Reservoir(10000);
      type.values = type.values || defaultValue;
      
      addToValue(type, value);
    }
  };

  /**
   * handles a field from a document. Passes the value to `addToType`.
   *
   * @param {String}  path     field path in dot notation
   * @param {Any}     value    value of the field
   * @param {Object}  schema   the updated schema object
   */
  addToField = function(path, value, schema) {
    var defaults = {};

    var pathSplitOnDot = path.split('.');
    defaults[path] = {
      name: pathSplitOnDot[pathSplitOnDot.length - 1],
      path: path,
      count: 0,
      types: {}
    };
    defaultsDeep(schema, defaults);
    var field = schema[path];

    field.count++;
    // debug('added to field', field);
    addToType(path, value, field.types);
  };

  function cleanup() {
    if (!finalized) {
      finalizeSchema(rootSchema);
      finalized = true;
    }
  }

  var parser = es.through(function write(obj) {
    
    Object.keys(obj).forEach(key => addToField(key, obj[key], rootSchema.fields));
    rootSchema.count += 1;
    this.emit('progress', obj);
  }, function end() {
    cleanup();
    this.emit('data', rootSchema);
    this.emit('end');
  });

  parser.on('close', function() {
    cleanup();
    this.destroy();
  });

  return parser;
};
