#!/usr/bin/env node

var schema = require('../');
var fs = require('fs');
var docopt = require('docopt').docopt;
var pkg = require('../package.json');
var argv = docopt(fs.readFileSync(__dirname + '/m.docopt', 'utf-8'), version: pkg.version});
