# mongodb-schema [![][npm_img]][npm_url] [![][travis_img]][travis_url] [![][coverage_img]][coverage_url] [![][gitter_img]][gitter_url]

Infer a probabilistic schema for a MongoDB collection.

A high-level view of the class interactions is as follows:

![](./docs/mongodb-schema_diagram.png)

## Example

`mongodb-schema` doesn't do anything directly with `mongodb` so to try the examples we'll install the node.js driver.  
As well, we'll need some data in a collection to derive the schema of.

Make sure you have a `mongod` running on localhost on port 27017 (or change the example accordingly). Then, do:

1. `npm install mongodb mongodb-schema`
2. `mongo --eval "db.test.insert([{_id: 1, a: true}, {_id: 2, a: 'true'}, {_id: 3, a: 1}, {_id: 4}])" localhost:27017/test`
3. Create a new file `parse-schema.js` and paste in the following code:
  ```javascript
  var parseSchema = require('mongodb-schema');
  var connect = require('mongodb');

  connect('mongodb://localhost:27017/test', function(err, db){
    if(err) return console.error(err);

    parseSchema('test.test', db.collection('test').find(), function(err, schema){
      if(err) return console.error(err);

      console.log(JSON.stringify(schema, null, 2));
      db.close();
    });
  });
  ```
4. When we run the above with `node parse-schema.js`, we'll see something
  like the following (some fields not present here for clarity):

  ```javascript
  {
    "count": 4,                   // parsed 4 documents
    "ns": "test.test",            // namespace
    "fields": [                   // an array of Field objects, @see `./lib/field.js`
      {
        "name": "_id",
        "count": 4,               // 4 documents counted with _id
        "type": "Number",         // the type of _id is `Number`
        "probability": 1,         // all documents had an _id field
        "unique": 4,              // 4 unique values found
        "has_duplicates": false,  // therefore no duplicates
        "types": [                // an array of Type objects, @see `./lib/types/`
          {
            "name": "Number",     // name of the type
            "count": 4,           // 4 numbers counted
            "probability": 1,
            "unique": 4,
            "values": [           // array of encountered values
              1,
              2,
              3,
              4
            ]
          }
        ]
      },
      {
        "name": "a",
        "count": 3,               // only 3 documents with field `a` counted
        "probability": 0.75,      // hence probability 0.75
        "type": [                 // found these types
          "Boolean",
          "String",
          "Number",
          "Undefined"             // for convenience, we treat Undefined as its own type
        ],
        "unique": 3,
        "has_duplicates": false,   // there were no duplicate values
        "types": [
          {
            "name": "Boolean",
            "count": 1,
            "probability": 0.25,  // probabilities for types are calculated factoring in Undefined
            "unique": 1,
            "values": [
              true
            ]
          },
          {
            "name": "String",
            "count": 1,
            "probability": 0.25,
            "unique": 1,
            "values": [
              "true"
            ]
          },
          {
            "name": "Number",
            "count": 1,
            "probability": 0.25,
            "unique": 1,
            "values": [
              1
            ]
          },
          {
            "name": "Undefined",
            "count": 1,
            "probability": 0.25,
            "unique": 0
          }
        ]
      }
    ]
  }
```

### More Examples

`mongodb-schema` supports all [BSON types][bson-types].
Checkout [the tests][tests] for more usage examples.


## Schema Statistics

To compare schemas quantitatively we introduce the following measurable metrics on a schema:

### Schema Depth
The schema depth is defined as the maximum number of nested levels of keys in the schema. It does not matter if the subdocuments are nested directly or as elements of an array. An empty document has a depth of 0, whereas a document with some top-level keys but no nested subdocuments has a depth of 1.

### Schema Width
The schema width is defined as the number of individual keys, added up over all nesting levels of the schema. Array values do not count towards the schema width.

### Examples

```js
{}
```

Statistic    | Value
:----------- | :---:
Schema Depth | 0
Schema Width | 0


```js
{
  one: 1
}
```

Statistic    | Value
:----------- | :---:
Schema Depth | 1
Schema Width | 1


```js
{
  one: [
    "foo",
    "bar",
    {
      two: {
        three: 3
      }
    },
    "baz"
  ],
  foo: "bar"
}
```

Statistic    | Value
:----------- | :---:
Schema Depth | 3
Schema Width | 4

```js
{
  a: 1,
  b: false,
  one: {
    c: null,
    two: {
      three: {
        four: 4,
        e: "deepest nesting level"
      }
    }
  },
  f: {
    g: "not the deepest level"
  }
}
```

Statistic    | Value
:----------- | :---:
Schema Depth | 4
Schema Width | 10


```js
// first document
{
  foo: [
    {
      bar: [1, 2, 3]
    }
  ]
},
// second document
{
  foo: 0
}
```

Statistic    | Value
:----------- | :---:
Schema Depth | 2
Schema Width | 2



## Installation

```
npm install --save mongodb-schema
```

## Testing

```
npm test
```

## Dependencies

Under the hood, `mongodb-schema` uses [ampersand-state][ampersand-state] and
[ampersand-collection][ampersand-collection] for modeling [Schema][schema], [Field][field]'s, and [Type][type]'s.

**Note:** Currently we are pinning [ampersand-state][ampersand-state] to version 4.8.2 due
to a backwards-breaking change introduced in version 4.9.x. For more details, see [ampersand-state issue #226](https://github.com/AmpersandJS/ampersand-state/issues/226).


## License

Apache 2.0



[bson-types]: http://docs.mongodb.org/manual/reference/bson-types/
[ampersand-state]: http://ampersandjs.com/docs#ampersand-state
[ampersand-collection]: http://ampersandjs.com/docs#ampersand-collection
[tests]: https://github.com/mongodb-js/mongodb-schema/tree/master/test
[schema]: https://github.com/mongodb-js/mongodb-language-model/blob/master/lib/schema.js
[field]: https://github.com/mongodb-js/mongodb-language-model/blob/master/lib/field.js
[type]: https://github.com/mongodb-js/mongodb-language-model/blob/master/lib/type.js

[travis_img]: https://secure.travis-ci.org/mongodb-js/mongodb-schema.svg?branch=master
[travis_url]: https://travis-ci.org/mongodb-js/mongodb-schema
[npm_img]: https://img.shields.io/npm/v/mongodb-schema.svg
[npm_url]: https://www.npmjs.org/package/mongodb-schema
[coverage_img]: https://coveralls.io/repos/mongodb-js/mongodb-schema/badge.svg
[coverage_url]: https://coveralls.io/r/mongodb-js/mongodb-schema
[gitter_img]: https://badges.gitter.im/Join%20Chat.svg
[gitter_url]: https://gitter.im/mongodb-js/mongodb-js
