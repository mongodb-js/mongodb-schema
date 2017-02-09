var gvl = require('geojson-validation');

module.exports = function(value) {
  return gvl.isGeoJSONObject(value);
};
