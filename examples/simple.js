#!/usr/bin/env node

var schema = require('../');
var es = require('event-stream');

var docs = [
  {
    _id: 1,
    username: 'Adam'
  },
  {
    _id: 2,
    username: 'Brian'
  }
];


es.readArray(docs).pipe(schema.stream()).pipe(es.stringify());
