# mongodb-schema

[![build status](https://secure.travis-ci.org/mongodb-js/mongodb-schema.png)](http://travis-ci.org/mongodb-js/mongodb-schema)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/mongodb-js/mongodb-js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Infer a probabilistic schema for a MongoDB collection.

## Example

```javascript
var schema = require('mongodb-schema')();
var connect = require('mongodb');

var parser = schema.stream()
  .on('error', function(err){
    console.error('Error parsing schema: ', err);
  })
  .on('data', function(doc){
    console.log('schema updated for doc', doc);
  })
  .on('end', function(){
    console.log('schema looks like:', schema);
  });

connect('mongodb://localhost:27017/test', function(err, db){
  if(err) return console.error(err);

  db.test.find().stream().pipe(parser);
});
```

## Installation

```
npm install --save mongodb-schema
```

## Testing

```
npm test
```

## License

Apache 2.0
