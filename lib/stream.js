var es = require('event-stream');
var _ = require('lodash');
var Reservoir = require('reservoir');

// var debug = require('debug')('mongodb-schema:stream');


/**
* extracts a Javascript string from a BSON type to compute unique values.
*
* @param {Any} value     value to be converted to a string
* @return {String}       converted value
*/
var extractStringValueFromBSON = function(value) {
  if (_.has(value, '_bsontype')) {
    if (_.includes([ 'Decimal128', 'Long' ], value._bsontype)) {
      return value.toString();
    }
    if (_.includes([ 'Double', 'Int32' ], value._bsontype)) {
      return String(value.value);
    }
  }
  if (_.isString(value)) {
    return value;
  }
  return String(value);
};

/**
 * Returns the type of value as a string. BSON type aware. Replaces `Object`
 * with `Document` to avoid naming conflicts with javascript Objects.
 *
 * @param  {Any} value   value for which to get the type
 * @return {String}      type as string, e.g. `ObjectId`, `Document`, `Date`,
 *                       `Number`, `Undefined`, `Boolean`, ...
 */
var getTypeName = function(value) {
  var T;
  if (_.has(value, '_bsontype')) {
    T = value._bsontype;
  } else {
    T = Object.prototype.toString.call(value).replace(/\[object (\w+)\]/, '$1');
  }
  if (T === 'Object') {
    T = 'Document';
  }
  return T;
};

var addToField;

var addToValue = function(type, value) {
  if (type.name === 'String') {
    // crop strings at 1k characters
    if (value.length > 1000) {
      value = value.slice(0, 1000);
    }
  }
  type.values.pushSome(value);
};

var addToType = function(path, value, schema) {
  var typeName = getTypeName(value);
  var type = schema[typeName] = _.get(schema, typeName, {
    name: typeName,
    path: path,
    count: 0
  });
  type.count++;
  // debug('added to type', type);
  if (typeName === 'Array') {
    type.types = _.get(type, 'types', {});
    type.lengths = _.get(type, 'lengths', []);
    type.lengths.push(value.length);
    _.each(value, function(v) {
      addToType(path, v, type.types);
    });
  } else if (typeName === 'Document') {
    type.fields = _.get(type, 'fields', {});
    _.forOwn(value, function(v, k) {
      addToField(path + '.' + k, v, type.fields);
    });
  } else {
    var reservoirSize = _.includes(['String', 'Binary'], type.name) ? 1000 : 10000;
    type.values = _.get(type, 'values', new Reservoir(reservoirSize));
    addToValue(type, value);
  }
};

addToField = function(path, value, schema) {
  var field = schema[path] = _.get(schema, path, {
    name: _.last(path.split('.')),
    path: path,
    count: 0,
    types: {}
  });
  field.count++;
  // debug('added to field', field);
  addToType(path, value, field.types);
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
    _.each(schema, function(field) {
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
      field.total_count = _.sum(field.types, 'count');

      // recursively finalize types
      finalizeSchema(field.types, field, 'types');
      field.type = _.pluck(field.types, 'name');
      if (field.type.length === 1) {
        field.type = field.type[0];
      }
      // a field has duplicates when any of its types have duplicates
      field.has_duplicates = _.any(field.types, 'has_duplicates');
      // compute probability
      field.probability = field.count / parent.count;
    });
    // turn object into array
    parent.fields = _.values(parent.fields).sort(fieldComparator);
  }
  if (tag === 'types') {
    _.each(schema, function(type) {
      type.total_count = _.sum(type.lengths);
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
        type.unique = _.uniq(type.values, false, extractStringValueFromBSON).length;
        type.has_duplicates = type.unique !== type.values.length;
      }
      // compute `average_length` for array types
      if (type.lengths) {
        type.average_length = type.total_count / type.lengths.length;
      }
      // recursively finalize fields and types
    });
    parent.types = _.sortByOrder(_.values(parent.types), 'probability', 'desc');
  }
  return schema;
};

/**
 * wraps finalizeSchema inside an event-stream map function (synchronous)
 */

module.exports = function parse() {
  /* eslint no-sync: 0 */

  var schema = {
    fields: {},
    count: 0
  };

  var finalized = false;

  function cleanup() {
    if (!finalized) {
      finalizeSchema(schema);
      finalized = true;
    }
  }

  var parser = es.through(function write(obj) {
    _.each(_.keys(obj), function(key) {
      addToField(key, obj[key], schema.fields);
    });
    schema.count += 1;
    this.emit('progress', obj);
  }, function end() {
    cleanup();
    this.emit('data', schema);
    this.emit('end');
  });

  parser.on('close', function() {
    cleanup();
    this.destroy();
  });

  return parser;
};
