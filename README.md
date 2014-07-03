mongodb-schema
==============

Infer probabilistic schema of JSON documents, javascript objects or a MongoDB collection. 

This package is dual-purpose. It serves as a node.js module and can also be used with MongoDB directly, where it extends the `DBCollection` shell object.

_mongodb-schema_ is an early prototype. Use at your own risk.

<br>

## Usage with Node.js

### Installation
Install the script with:

```
npm install mongodb-schema
```

### Usage 

Then load the module and use it like this (optionally with an options object as second parameter):
```js
var schema = require('mongodb-schema');

// define some documents
var documents = [
    {a: 1},
    {a: {b: "hello"}}
];

// infer schema
schema_obj = schema( documents, {flat: true} );

// pretty print
console.log( JSON.stringify(schema_obj, null, '\t') );
```


<br>


## Usage with MongoDB

### Installation

There are two ways to load the script, one-time (for testing) and permanent (for frequent use).

#### 1. Load the script directly (one-time usage)

This will load the `mongodb-schema.js` and the open the shell as usual. You will have to add the script every time you open the shell. 

```
mongo <basepath>/lib/mongodb-schema.js --shell
```

Replace the `<basepath>` part with the actual path where the `mongodb-schema` is located.

#### 2. Load the script via the `.mongorc.js` file (permanent usage)

You can also add the following line to your `~/.mongorc.js` file to always load the file on shell startup (unless started with `--norc`):

```js
load('<basepath>/lib/mongodb-schema.js')
```

Replace the `<basepath>` part with the actual path where the `mongodb-schema` is located.


### Usage

##### Basic Usage

The script extends the `DBCollection` object to have another new method: `.schema()`. On a collection called `foo`, run it with:

```js
db.foo.schema()
```

This will use the first 100 (by default) documents from the collection and calculate a probabilistic schema based on these documents.

##### Usage with options

You can pass in an options object into the `.schema()` method. Currently it supports 2 options: `numSamples` and `flat`.

```js
db.foo.schema( {numSamples: 20, flat: true} )
```

This will use the first 20 documents to calculate the schema and return the schema as flat object (all fields are collapsed to the top with dot-notation). 

<br> 

## Example schemata

#### Example of nested schema (default)

100 documents were passed to the schema function (in MongoDB-mode, this is the default if the `numSamples` option is not specified).

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


#### Example of flat schema

20 documents were passed to the schema function, as well as the option `{flat: true}`.

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