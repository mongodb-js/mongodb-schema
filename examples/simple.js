#!/usr/bin/env node

var schema = require('../')();
var es = require('event-stream');

var docs = [
  {
    _id: 1,
    username: 'Adam'
  },
  {
    _id: 2,
    username: 'Brian'
  },
  {
    _id: 3,
    username: 'Cat'
  }
];


es.readArray(docs).pipe(schema.stream().on('end', function(){
  console.log('Finalized schema has fields: ', JSON.stringify(schema.fields, null, 2));
})).pipe(es.stringify()).pipe(process.stdout);
