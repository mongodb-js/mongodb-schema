var es = require('event-stream');
var _ = require('lodash');
var Reservoir = require('reservoir');

var debug = require('debug')('mongodb-schema:parse-native');

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
    // crop strings at 10k characters
    if (value.length > 10000) {
      value = value.slice(0, 10000);
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
    type.values = _.get(type, 'values', type.name === 'String' ?
      new Reservoir(100) : new Reservoir(10000));
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
  debug('\n\nschema', schema);
  // debug('parent', parent);
  debug('tag', tag);

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
      // recursively finalize types
      debug('recursively calling schema.types');
      finalizeSchema(field.types, field, 'types');
      field.type = _.pluck(field.types, 'name');
      if (field.type.length === 1) {
        field.type = field.type[0];
      }
      // compute probability
      debug('computing probabilities for field %s: %d / %d = %d', field.name, field.count, parent.count, field.count / parent.count);
      field.probability = field.count / parent.count;
      field.total_count = _.sum(field.types, 'count');
    });
    // turn object into array
    parent.fields = _.values(parent.fields);
  }
  if (tag === 'types') {
    _.each(schema, function(type) {
      // debug('recursively calling schema.fields');
      finalizeSchema(type.fields, type, 'fields');
      // debug('recursively calling schema.types');
      finalizeSchema(type.types, type, 'types');
      // compute `probability` for each type
      var divisor = parent.total_count || parent.count;
      if (divisor === 0) {
        type.probability = 0;
      } else if (type.count === 0) {
        type.probability = type.count + 1 / divisor;
      } else {
        type.probability = type.count / divisor;
      }
      debug('\ncomputing probabilities for type = %d', type.probability);
      debug('  type.count', type.count);
      debug('  parent.total_count', parent.total_count);
      debug('  parent.count', parent.count);
      debug('  parent', parent);
      debug('  divisor', divisor);
      // compute `unique` and `has_duplicates` for each type
      if (type.values) {
        type.unique = _.uniq(type.values).length;
        type.has_duplicates = type.unique !== type.count;
      }
      // compute `average_length` for array types
      if (type.lengths) {
        type.average_length = _.sum(type.lengths) / type.lengths.length;
      }
      // recursively finalize fields and types
    });
    parent.types = _.values(parent.types);
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
      debug('cleanup', JSON.stringify(schema, null, ' '));
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
