mongodb-schema
==============

Extends the `DBCollection` object in the mongo shell to infer the schema of a MongoDB collection.

This is an early prototype. Use at your own risk. 


### Installation

Two ways to invoke the script.

##### 1. Load the script directly (one-time usage)

This will load the `mongodb-schema.js` and the open the shell as usual. You will have to add the script every time you open the shell. 

```
mongo mongodb-schema.js --shell
```

##### 2. Load the script via the `.mongorc.js` file (permanent usage)

You can also add the following line to your `~/.mongorc.js` file to always load the file on shell startup (unless started with `--norc`):

```js
load('/<path-to>/mongodb-schema.js')
```

Replace the `<path-to>` part with the actual path where the `mongodb-schema.js` is located.


### Usage

##### Basic Usage

The script extends the `DBCollection` object to have another new method: `.schema()`. On a collection called `foo`, run it with:

```js
db.foo.schema()
```

This will use the first 100 (by default) documents from the collection and calculate a probabilistic schema based on these documents.

Example of schema:
```json
{
    "$c": 100,
    "_id": {
        "$c": 100,
        "$p": 1, 
        "type": "ObjectId"
    },
    "a": {
        "$c": 100,
        "$p": 1,
        "b": {
            "$c": 100,
            "$p": 1,
            "$type": "number"
        },
        "c": {
            "$c": 70,
            "$p": 0.7,
            "$type": "string"
        }
    }
}
```


##### Usage with options

You can pass in an options object into the `.schema()` method. Currently it supports 2 options: `numSamples` and `flat`.

```js
db.foo.schema( {numSamples: 20, flat: true} )
```

This will use the first 20 documents to calculate the schema and return the schema as flat object (all fields are collapsed to the top with dot-notation). 

Example of _flat_ schema:
```json
{
    "$c": 20,
    "_id": {
        "$c": 20,
        "$p": 1, 
        "type": "ObjectId"
    },
    "a.b": {
        "$c": 20,
        "$p": 1,
        "$type": "number"
    },
    "a.c": {
        "$c": 13,
        "$p": 0.65,
        "$type": "string"
    }
}
```