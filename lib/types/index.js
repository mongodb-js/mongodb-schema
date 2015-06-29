var _ = require('lodash');

_.extend(module.exports,
  require('./constant'),
  require('./primitive'),
  require('./array'),
  require('./document')
);
