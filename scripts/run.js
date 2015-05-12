var schema = require('..');
var data = require('../fixtures/worldusers');

console.log(JSON.stringify(schema(data), null, 2));
