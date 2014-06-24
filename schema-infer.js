function infer(schema, obj) {
    schema['$count'] = ('$count' in schema) ? schema['$count'] + 1 : 1;
    
    if (!('$type' in schema)) {
        schema['$type'] = {};
    }
    var type = typeof obj;
    schema['$type'][type] = (type in schema['$type']) ? schema['$type'][type] + 1 : 1;

    if (obj && typeof obj == 'object') {

        Object.keys(obj).forEach(function(key) {
            var val = obj[key];
            if (!(key in schema)) {
                schema[key] = {};
            }

            if (val instanceof Array) {
                // special case: lists, here collapse
                val.forEach(function (el) {
                    infer(schema[key], el);
                });
            } else {
                // objects need to be handled recursively
                infer(schema[key], val)
            }
        });

    }
    return schema;
}

function cleanup(schema) {

    if (typeof schema !== 'object') {
        return schema;
    }
    
    var prob = schema['$count'];

    Object.keys(schema).forEach( function(key) {
        // remove sole object types
        if (key === '$type') {
            var type_keys = Object.keys(schema[key]);
            if (type_keys.length == 1) {
                if (type_keys[0] == 'object') {
                    delete schema[key];
                } else {
                    schema[key] = type_keys[0];
                }
            }
        }
        
        cleanup(schema[key]);
    });

    return schema;
}


DBCollection.prototype.schema = function(numSamples) {
    var numSamples = numSamples || 100;
    var schema = {};
    var cursor = this.find({}, null, numSamples /* limit */, 0 /* skip*/, 0 /* batchSize */);

    cursor.forEach(function (doc) {
        schema = infer(schema, doc);
    });

    schema = cleanup(schema);
    return schema;
}
