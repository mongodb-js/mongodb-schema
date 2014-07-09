var schema_sync = require('./lib/mongodb-schema.js');

// async wrapper for mongodb-schema 
var schema = function(documents, options, callback) {
    
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    // only execute on next event loop iteration
    process.nextTick(function () {
        try {
            var res = schema_sync(documents, options);
            callback(null, res);
        } catch (e) {
            callback(e);
        }
    }); 
}

module.exports = schema;