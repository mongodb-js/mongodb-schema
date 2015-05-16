var Schema = require('./schema');
module.exports = function() {
  return new Schema();
};
module.exports.extend = Schema.extend.bind(Schema);
module.exports.Schema = Schema;
module.exports.getType = require('./type').getNameFromValue;
