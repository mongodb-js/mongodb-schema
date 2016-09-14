# mongodb-schema [![][npm_img]][npm_url] [![][travis_img]][travis_url] [![][coverage_img]][coverage_url]

Infer a probabilistic schema for a MongoDB collection.

## Usage

`mongodb-schema` can be used as a command line tool or programmatically in your application as a node module.

### Command line

To install mongodb-schema for command line use, run `npm install -g mongodb-schema`. This will add a new
shell script which you can run directly from the command line.

The command line tool expects a MongoDB connection URI and a namespace in the form `<database>.<collection>`.
Without further arguments, it will sample 100 random documents from the collection and print a schema of
the collection in JSON format to stdout.

```
mongodb-schema mongodb://localhost:27017 mongodb.fanclub
```            

Additional arguments change the number of samples (`--sample`), print additional statistics about the
schema analysis (`--stats`), switch to a different output format (`--format`), or let you suppress the
schema output altogether (`--no-output`) if you are only interested in the schema statistics.

For more information, run

```
mongodb-schema --help
```    

### API

The following example demonstrates how `mongodb-schema` can be used programmatically from
your node application. You need to additionally install the MongoDB node driver to follow
along with this example.

Make sure you have a `mongod` running on localhost on port 27017 (or change the example
below accordingly).

1. From your application folder, install the driver and `mongodb-schema` locally:

   ```
   npm install mongodb mongodb-schema
   ```

2. (optional) If you don't have any data in your MongoDB instance yet, you can create a
`test.data` collection with this command:

    ```
    mongo --eval "db.data.insert([{_id: 1, a: true}, {_id: 2, a: 'true'}, {_id: 3, a: 1}, {_id: 4}])" localhost:27017/test`
    ```

3. Create a new file `parse-schema.js` and paste in the following code:

    ```javascript
    var parseSchema = require('mongodb-schema');
    var connect = require('mongodb');

    connect('mongodb://localhost:27017/test', function(err, db) {
      if (err) return console.error(err);

      // here we are passing in a cursor as the first argument. You can
      // also pass in a stream or an array of documents directly.
      parseSchema(db.collection('data').find(), function(err, schema) {
        if (err) return console.error(err);

        console.log(JSON.stringify(schema, null, 2));
        db.close();
      });
    });
    ```

4. When we run the above with `node ./parse-schema.js`, we'll see output
  similar to this (some fields not present here for clarity):

  ```javascript
  {
    "count": 4,                   // parsed 4 documents
    "fields": [                   // an array of Field objects, @see `./lib/field.js`
      {
        "name": "_id",
        "count": 4,               // 4 documents counted with _id
        "type": "Number",         // the type of _id is `Number`
        "probability": 1,         // all documents had an _id field
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

A high-level view of the schema tree structure is as follows:

![](./docs/mongodb-schema_diagram.png)


## BSON Types

`mongodb-schema` supports all [BSON types][bson-types].
Checkout [the tests][tests] for more usage examples.


## Schema Statistics

To compare schemas quantitatively we introduce the following measurable metrics on a schema:

#### Schema Depth
The schema depth is defined as the maximum number of nested levels of keys in the schema. It does not matter if the subdocuments are nested directly or as elements of an array. An empty document has a depth of 0, whereas a document with some top-level keys but no nested subdocuments has a depth of 1.

#### Schema Width
The schema width is defined as the number of individual keys, added up over all nesting levels of the schema. Array values do not count towards the schema width.

#### Examples

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


## Testing

```
npm test
```

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
