var es = require('event-stream');
var _ = require('lodash');
var Reservoir = require('reservoir');

// var debug = require('debug')('mongodb-schema:parse2');

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

var addToType = function(path, value, schema) {
  var typeName = getTypeName(value);
  var type = schema[typeName] = _.get(schema, typeName, {
    name: typeName,
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
    _.each(value, function(v, k) {
      addToField(path + '.' + k, v, type.fields);
    });
  } else {
    type.values = _.get(type, 'values', new Reservoir(100));
    // if (type.values.length < 100) {
    //   type.values.push(value);
    // }
    type.values.pushSome(value);
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


var schema = {
  fields: {},
  count: 0
};

var parser = es.through(function write(obj) {
  _.each(_.keys(obj), function(key) {
    addToField(key, obj[key], schema.fields);
  });
  schema.count += 1;
}, function end() {
  this.emit('data', schema);
  this.emit('end');
});


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
          count: missing
        };
      }
      // recursively finalize types
      finalizeSchema(field.types, field, 'types');
      field.type = _.pluck(field.types, 'name');
      if (field.type.length === 1) {
        field.type = field.type[0];
      }
      // compute probability
      field.probability = field.count / parent.count;
      field.total_count = _.sum(field.types, 'count');
    });
    // turn object into array
    parent.fields = _.values(parent.fields);
  }
  if (tag === 'types') {
    _.each(schema, function(type) {
      finalizeSchema(type.fields, type, 'fields');
      finalizeSchema(type.types, type, 'types');
      // compute `probability` for each type
      type.probability = type.count / (parent.total_count || parent.count);
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
var finalizer = es.mapSync(finalizeSchema);

module.exports = function parse(model) {
  /* eslint no-sync: 0 */
  return es.pipeline(parser, finalizer, es.map(function(data, cb) {
    // debug('result', data);
    if (model) {
      model.set(data, {
        parse: true
      });
    }
    cb(null, data);
  }));
};
