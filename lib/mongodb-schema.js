/**
 * calculates schema of a collection by sampling some of the documents
 * 
 * @param {Array} documents 
 * @param {Object} options currently only supports one option: {flat: true}
 *
 * @returns {Object} the schema document with counts ($c), types ($t),
 *                   an array flag ($a) and probability of occurrence
 *                   given the parent field ($p).
 */
 function schema(documents, options) {
    /**
     * right-aligned string split
     * 
     * @param {String} str string to split 
     * @param {String} sep character to use for split, or null for any whitespace
     * @param {Number} maxsplit maximum number of splits (from the end of the string)
     *
     * @returns {Array} an array with (if provided, at most maxsplit) elements
     *
     * @example
     * // returns ["foo.bar", "baz"]
     * _rsplit( "foo.bar.baz", ".", 1 )
     */
    function _rsplit(str, sep, maxsplit) {
        var split = str.split(sep || /\s+/);
        return maxsplit ? [ split.slice(0, -maxsplit).join(sep) ].concat(split.slice(-maxsplit)) : split;    
    }

    /**
     * flattens an object and results in an object with only top-level properties with dot-notation
     * 
     * @param {Object} obj object to flatten
     *
     * @return {Number} maxsplit maximum number of splits (from the end of the string)
     *
     * @example
     * // returns {"a.b" 1, "a.c": false}
     * _flatten( {a: {b: 1, c: false}} )
     */
    var _flatten = function(obj) {
        function recursive(obj) {
            var result = {};
            
            for (var o in obj) {
                if (!obj.hasOwnProperty(o)) continue;
                if (((typeof obj[o]) === 'object') && ([$t, $d].indexOf(o) === -1)) {
                    var flatObject = recursive(obj[o]);
                    for (var x in flatObject) {
                        if (!flatObject.hasOwnProperty(x)) continue;
                        
                        result[o + '.' + x] = flatObject[x];
                    }
                } else {
                    result[o] = obj[o];
                }
            }
            return result;
        }

        // first flatten completely
        var flatobj = recursive(obj);

        // now fold back in $-prefixed leaves
        var finalobj = {};
        
        for (var f in flatobj) {
            // only own proerties
            if (!flatobj.hasOwnProperty(f)) continue;

            if (f.indexOf('.') !== -1) {
                split = _rsplit(f, '.', 1);
                if (!(split[0] in finalobj)) {
                    finalobj[split[0]] = {};
                }
                finalobj[split[0]][split[1]] = flatobj[f];
            } else {
                finalobj[f] = flatobj[f];
            }
        }

        return finalobj;
    };

    
    /**
     * recursively infers a schema of an object, keeping track of counts and types of nested objects
     *
     * @mixin {Object} schema resulting schema, initially {}
     * @param {Object} obj object to infer schema
     * 
     */
    function _infer(schema, obj) {
        schema[$c] = ($c in schema) ? schema[$c] + 1 : 1;
        
        if (!($t in schema)) {
            schema[$t] = {};
        }

        // special case: ObjectId, it's an object but we don't want to reach into it
        if (typeof ObjectId !== 'undefined' && obj instanceof ObjectId) {
            type = 'objectid';
            schema[$t][type] = (type in schema[$t]) ? schema[$t][type] + 1 : 1;
            return schema;        
        }

        var type = typeof obj;
        schema[$t][type] = (type in schema[$t]) ? schema[$t][type] + 1 : 1;

        if (obj && typeof obj == 'object') {

            Object.keys(obj).forEach(function(key) {
                var val = obj[key];
                if (!(key in schema)) {
                    schema[key] = {};
                }
                // handle data inference
                if (options.data) {
                    if (!($d in schema[key])) {
                        schema[key][$d] = {};
                    }
                    var d = schema[key][$d];
                    switch (typeof val) {
                        // numbers, calculate min and max
                        case 'number':
                            if (!('min' in d)) d['min'] = Infinity;
                            if (!('max' in d)) d['max'] = -Infinity;
                            d['min'] = (val < d['min']) ? val : d['min']; 
                            d['max'] = (val > d['max']) ? val : d['max']; 
                            break;
                        // strings, collect histogram
                        case 'string':
                            if (val in d) {
                                d[val]++;
                            } else {
                                if (Object.keys(d).length < options.data.maxCardinality) {
                                    d[val] = 1;
                                }
                            }
                            break;
                    }
                }

                if (val instanceof Array) {
                    // special case: lists, here collapse
                    val.forEach(function (el) {
                        _infer(schema[key], el);
                    });
                    schema[key][$a] = true;
                } else {
                    // objects need to be handled recursively
                    _infer(schema[key], val)
                }
            });

        }
        return schema;
    }

    /**
     * clean up the output of _infer, collapsing single types and calculating 
     * probabilities (stored in "$p" field)
     *
     * @param {Object} schema 
     * @param {Number} count keep track of count in recursive calls
     * 
     * @returns {Object} cleaned up schema
     */
    function _cleanup(schema, count) {
        if (typeof schema !== 'object') {
            return schema;
        }
        Object.keys(schema).sort().reverse().forEach( function(key) {
            if (key === $t) {
                // remove sole object types
                var type_keys = Object.keys(schema[key]);
                if (type_keys.length == 1) {
                    if (type_keys[0] == 'object') {
                        delete schema[key];
                    } else {
                        schema[key] = type_keys[0];
                    }
                }
            }
            if (key === $c) {
                // calculate probability and set count for recursive call
                if (count) {
                    schema[$p] = schema[$c] / count;
                }
                count = schema[$c];
            }
            
            if (key === $d) {
                // remove data for inner nodes
                if (!($t in schema)) {
                    delete schema[$d];
                }
                // remove mixed data
                if (typeof schema[$t] === 'object') {
                    delete schema[$d];
                }
                // remove unique strings
                if (schema[$t] === 'string') {
                    // check for uniqueness
                    var values = Object.keys( schema[$d] ).map(function ( key ) { return schema[$d][key]; });
                    var maxCount = Math.max.apply( null, values );
                    if (maxCount === 1 && values.length > 1) {
                        schema[$d] = 'unique';
                    }
                }
            }

            _cleanup(schema[key], count);
        });

        return schema;
    }

    // define defaults
    var options = options || {};
    options.flat = options.flat || false;
    options.data = options.data || false;
    options.metavars = options.metavars || {count: '$count', type: '$type', data: '$data', array: '$array', prob: '$prob'};

    // remap options.metavars
    var $c = options.metavars.count,
        $t = options.metavars.type,
        $d = options.metavars.data,
        $a = options.metavars.array,
        $p = options.metavars.prob;

    // nested options.data 
    if (options.data) {
        if (typeof options.data !== 'object') {
            options.data = {};
        }
        options.data.maxCardinality = options.data.maxCardinality || 100;
    }
    
    // infer schema of each document
    var schema = {};
    documents.forEach(function (doc) {
        schema = _infer(schema, doc);
    });

    // clean up schema
    schema = _cleanup(schema);

    // return deep or flat version
    if (options.flat) {
        return _flatten(schema);
    } else {
        return schema;
    }
}

/**
 * extend the DBCollection object to provide the .schema() method
 * 
 * @param {Object} options supports two options: {samples: 123, flat: true}
 *
 * @returns {Object} the schema document with counts ($c), types ($t),
 *                   an array flag ($a) and probability of occurrence
 *                   given the parent field ($p).
 */
if (typeof DBCollection !== 'undefined') {
    DBCollection.prototype.schema = function(options) {
        
        // default options
        var options = options || {};
        options.samples = options.samples || 100;

        // limit of 0 means all documents
        if (options.samples === 'all') {
            options.samples = 0;
        }

        // get documents
        var cursor = this.find({}, null, options.samples /* limit */, 0 /* skip*/, 0 /* batchSize */);

        return schema(cursor, options);
    }
}

// export for node.js if module is defined
if (typeof module !== 'undefined') {
    module.exports = schema;
}