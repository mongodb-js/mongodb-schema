var fs = require('fs');
var es = require('event-stream');
var esReduce = require('stream-reduce');
var _ = require('lodash');
var connect = require('mongodb');

// var debug = require('debug')('gold-standard');

var ts = new Date();

var mapFields;
var mapType;

var getTypeName = function(value) {
  var T;
  if (_.has(value, '_bsontype')) {
    T = value._bsontype;
  } else {
    T = Object.prototype.toString.call(value).replace(/\[object (\w+)\]/, '$1');
  }
  // don't want to create naming conflict with javascript Object
  if (T === 'Object') {
    T = 'Document';
  }
  return T;
};

mapType = function(value, prefix) {
  var type = {
    name: getTypeName(value),
    count: 1
    // probability: 1,
    // unique: 1
  };

  switch (type.name) {
    case 'Document':
      type.fields = mapFields(value, prefix);
      break;
    case 'Array':
      type.types = _.indexBy(_.map(value, mapType), 'name');
      type.values = value;
      break;
    default:
      type.values = [value];
  }
  return type;
};

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
        // probability: 1,
        // unique: 1,
        // has_duplicates: false,
        type: [typeName],
        types: types
      };
    })
    .value();
  return _.indexBy(fields, 'name');
};


// create new schema object with fake namespace
var mapper = function(doc, cb) {
  var schema = {
    count: 1,
    fields: mapFields(doc)
  };

  cb(null, schema);
};

var reducer = esReduce(function(acc, data) {
  return _.merge(acc, data, function(objectValue, sourceValue, key) {
    if (key === 'count') {
      return (objectValue || 0) + sourceValue;
    }
    if (key === 'type') {
      return _.uniq((objectValue || []).concat(sourceValue));
    }
    if (key === 'values') {
      objectValue = objectValue || [];
      if (objectValue.length < 100) {
        objectValue.concat(sourceValue);
      }
      return objectValue;
    }
  });
}, {});


if (process.argv.length < 3) {
  console.log('Usage: node parse-from-file.js <jsonfile>');
} else if (process.argv.length === 3) {
  fs.createReadStream(process.argv[2], {
    flags: 'r'
  })
    .pipe(es.split()) // split file into individual json docs (one per line)
    .pipe(es.parse()) // parse each doc
    .pipe(es.map(mapper)) // comment out this line to skip schema parsing
    .pipe(reducer)
    .pipe(es.stringify()) // stringify result
    .pipe(es.wait(function(err, res) { // assemble everything back together
      if (err) {
        throw err;
      }
      var dur = new Date() - ts;
      console.log(res);
      console.log('took ' + dur + 'ms.'); // log time it took to parse
    }));
} else if (process.argv.length > 3) {
  connect('mongodb://localhost:27017/test', function(err, db) {
    if (err) {
      throw console.error(err);
    }
    db.db(process.argv[2])
      .collection(process.argv[3])
      .find()
      .limit(Number(process.argv[4]) || 100)
      .stream()
      .pipe(es.map(mapper)) // comment out this line to skip schema parsing
      .pipe(reducer)
      .pipe(es.stringify()) // stringify result
      .pipe(es.wait(function(err, res) { // assemble everything back together
        if (err) {
          throw err;
        }
        var dur = new Date() - ts;
        console.log(res);
        console.log('took ' + dur + 'ms.'); // log time it took to parse
        db.close();
      }));
  });
}
