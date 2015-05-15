module.exports = flatten;
var debug = require('debug')('mongodb-schema:flatten');

function flatten(obj) {
  var flattened = {};

  function _route(prefix, value) {
    var i;

    if (value === null) {
      flattened[prefix] = null;
      return;
    }

    var type = typeof value;

    if (type === 'string') {
      flattened[prefix] = value;
    }
    // booleans, null and undefined
    else if (type === 'boolean' || obj === null || obj === undefined) {
      flattened[prefix] = value;
    }
    // numbers
    else if (type === 'number') {
      flattened[prefix] = value;
    }
    // dates
    else if (Object.prototype.toString.call(value) === '[object Date]') {
      flattened[prefix] = value;
    } else if (Array.isArray(value)) {
      len = value.length;
      flattened[prefix] = 'Array';

      if (len === 0) {
        _route(prefix + '[]', null);
      }
      for (i = 0; i < len; i++) {
        _route(prefix + '[' + i + ']', value[i]);
      }
    } else if (type === 'object') {
      if (value.hasOwnProperty('_bsontype')) {
        debug('_bsontype is %s', value._bsontype);
        flattened[prefix] = value;
      } else {
        var keys = Object.keys(value);
        var len = keys.length;
        if (prefix) {
          flattened[prefix] = 'Object';
        }

        if (prefix) {
          prefix = prefix + '.';
        }
        if (len === 0) {
          _route(prefix, null);
        }
        for (i = 0; i < len; i++) {
          _route(prefix + keys[i], value[keys[i]]);
        }
      }
    } else {
      throw new Error('Unknown type for ' + JSON.stringify(value));
    }
  }

  _route('', obj);

  return flattened;
}
