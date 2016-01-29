var es = require('event-stream');
var esReduce = require('stream-reduce');
var _ = require('lodash');

var mapFields;
var mapType;

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


/**
 * Helper function to map a value to a type subdocument in the schema. If the
 * type is `Document`, call mapFields recursively for the sub-fields. If the
 * type is `Array`, call mapType recursively for each element of the array,
 * then reduce inline.
 *
 * @param  {Object} value    value to parse
 * @param  {String} prefix   internal variable to pass path prefix down the
 *                           recursive calls.
 * @return {Object}          type object, for example:
 * @example
 *   {
 *     Number: {
 *       name: "Number",
 *       path: "address.street_no",
 *       count: 1,
 *       values: [16]
 *     }
 *   }
 */
mapType = function(value, prefix) {
  var type = {
    name: getTypeName(value),
    count: 1
  };

  switch (type.name) {
    case 'Document':
      type.fields = mapFields(value, prefix);
      break;
    case 'Array':
      var grouped = _.groupBy(_.map(value, mapType), 'name');
      type.types = _.mapValues(grouped, function(values) {
        var result = {
          count: 0,
          values: []
        };
        _.each(values, function(value) {
          return _.merge(result, value, function(objectValue, sourceValue, key) {
            if (key === 'count') {
              return objectValue + sourceValue;
            }
            if (key === 'values') {
              return (objectValue || []).concat(sourceValue);
            }
          });
        });
        return result;
      });
      type.total_count = value.length;
      type.lengths = [value.length];
      break;
    default:
      type.values = [value];
  }
  return type;
};

/**
 * Helper function to map fields to an object matching the schema shape.
 * Takes an object and returns an object of fields, each indexed by the field
 * name.
 *
 * @param  {Object} doc      object to parse
 * @param  {String} prefix   internal variable to pass path prefix down the
 *                           recursive calls, initially `undefined`
 * @return {Object}          fields object, for example:
 * @example
 *   {
 *     _id: {
 *       name: "_id",
 *       path: "_id",
 *       count: 1,
 *       type: ["ObjectId"],
 *       types: {
 *         ObjectId: {
 *           ... // see mapType above
 *         }
 *       }
 *     }
 *   }
 */
mapFields = function(doc, prefix) {
  var fields = _(doc)
    .pairs()
    .mapValues(function(kvp) {
      var key = kvp[0];
      var value = kvp[1];
      var path = prefix ? prefix + '.' + key : key;
      var typeName = getTypeName(value);
      var types = {};
      types[typeName] = mapType(value, path);
      return {
        name: key,
        path: path,
        count: 1,
        type: [typeName],
        types: types
      };
    })
    .value();
  return _.indexBy(fields, 'name');
};


/**
 * event-stream map function, applies `mapFields` above on the root schema.
 *
 * @param  {Object} doc   takes a single document and parses its fields
 * @param  {Function} cb  callback function when parsing is complete
 */
var mapper = es.map(function(doc, cb) {
  var schema = {
    count: 1,
    fields: mapFields(doc)
  };
  cb(null, schema);
});

/**
 * uses stream-reduce to reduce all data events to a single result object.
 * Adds up `count` values, combines `type` values (union), appends `length`
 * values, and concatenates `values` arrays.
 *
 * @param  {Object} acc     accumulator object, initially set to `{}`
 * @return {Object} data    objects from mapper to be reduced to single object.
 */
var reducer = esReduce(function(acc, data) {
  return _.merge(acc, data, function(objectValue, sourceValue, key) {
    if (key === 'count' || key === 'total_count') {
      return (objectValue || 0) + sourceValue;
    }
    if (key === 'type') {
      return _.uniq((objectValue || []).concat(sourceValue));
    }
    if (key === 'lengths') {
      objectValue = objectValue || [];
      objectValue.push.apply(objectValue, sourceValue);
    }
    if (key === 'values') {
      // add up to 100 example values
      objectValue = objectValue || [];
      if (objectValue.length < 100) {
        objectValue.push.apply(objectValue, sourceValue);
      }
      return objectValue;
    }
  });
}, {});


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
    // compute probability for all fields
    _.each(schema, function(field) {
      if (field.type && field.type.length === 1) {
        field.type = field.type[0];
      }
      field.probability = field.count / parent.count;
      // recursively finalize types
      finalizeSchema(field.types, field, 'types');
    });
    // turn object into array
    parent.fields = _.values(parent.fields);
  }
  if (tag === 'types') {
    // create `Undefined` pseudo-type
    var missing = parent.count - schema.count;
    if (missing > 0) {
      schema.Undefined = {
        name: 'Undefined',
        type: 'Undefined',
        count: missing
      };
    }
    _.each(schema, function(type) {
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
      finalizeSchema(type.types, type, 'types');
      finalizeSchema(type.fields, type, 'fields');
    });
    parent.types = _.values(parent.types);
  }
  return schema;
};

/**
 * wraps finalizeSchema inside an event-stream map function (synchronous)
 */
var finalizer = es.mapSync(finalizeSchema);

module.exports = function parse() {
  /* eslint no-sync: 0 */
  return es.pipeline(mapper, reducer, finalizer);
};
