/**
 * calculates schema of a collection by sampling some of the documents
 * 
 * @param {Array} documents 
 * @param {Object} options currently supports these options: 
 *                 flat: true/false    flatten the schema to dot-notation top-level names
 *                 data: true/false    run data sampling and return information about data
 *                 filter: {...}       only return fields/subfields that match the filter
 *
 * @returns {Object} the schema document with counts ($count), types ($type),
 *                   an array flag ($array) and probability of occurrence
 *                   given the parent field ($prob).
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
            // only own properties
            if (!flatobj.hasOwnProperty(f)) continue;

            if (f.indexOf('.') !== -1) {
                var split = _rsplit(f, '.', 1);
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

        // special case: Date (ISODate is also a Date)
        if (obj instanceof Date) {
            type = 'date';
            schema[$t][type] = (type in schema[$t]) ? schema[$t][type] + 1 : 1;
            return schema;        
        }

        // special case: nulls get their own type
        if (obj === null) {
            type = 'null';
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

                if (val instanceof Array) {
                    // special case: lists collapse here
                    val.forEach(function (el) {
                        // create n fake documents with single value
                        var doc = {};
                        doc[key] = el;
                        _infer(schema, doc);
                    });
                    // subtract n from total count
                    schema[$c] -= val.length;
                    schema[key][$a] = true;
                } else {
                    // objects need to be handled recursively
                    _infer(schema[key], val)
                }

                // handle data inference
                if (options.data && (Object.keys(schema[key][$t]).length === 1)) {
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
                                } else {
                                    d[$o] = $o in d ? d[$o] + 1 : 1;
                                }
                            }
                            break;
                        case 'object':
                            // dates, calculate min and max date
                            if (val instanceof Date) {
                                if (!('min' in d)) d['min'] = new Date(100000000*86400000);
                                if (!('max' in d)) d['max'] = new Date(-100000000*86400000); 
                                d['min'] = (val.getTime() < d['min'].getTime()) ? val : d['min']; 
                                d['max'] = (val.getTime() > d['max'].getTime()) ? val : d['max']; 
                            }
                            break;
                    }
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

        if (schema[$t] !== undefined) {
            var type_keys = Object.keys(schema[$t]);
            if (type_keys.length == 1) {
                if (type_keys[0] == 'object') {
                    delete schema[$t];
                } else {
                    schema[$t] = type_keys[0];
                }
            }
        }

        if (schema[$c] !== undefined) {
            if (count) {
                schema[$p] = schema[$c] / count;
            }
            count = schema[$c];
        }

        if (schema[$d] !== undefined) {
            // remove data for inner nodes
            if (!($t in schema)) {
                delete schema[$d];
            }
            // remove mixed data
            if (typeof schema[$t] === 'object') {
                delete schema[$d];
            }

            // remove boolean data
            if (schema[$t] === 'boolean') {
                delete schema[$d];
            }

            // remove null data
            if (schema[$t] === 'null') {
                delete schema[$d];
            }

            // remove unique strings
            if (schema[$t] === 'string') {
                // check for uniqueness
                var values = Object.keys( schema[$d] ).map(function ( key ) { return schema[$d][key]; });
                var maxCount = Math.max.apply( null, values );
                if (maxCount === 1 && values.length > 1) {
                    schema[$t] = 'text';
                    delete schema[$d];
                } else {
                    schema[$t] = 'category';
                }
            }
        }
            
        // recursive call for each property
        Object.keys(schema).forEach(function (key) {
            _cleanup(schema[key], count);
        });

        return schema;
    }

    function _getObjectValues(obj) {
        var values = Object.keys(obj).map(function (key) {
            return obj[key];
        });
        return values;
    }

    /**
     * filter leaf nodes of the schema based on a schema filter document, 
     * only return the matching ones.
     *
     * @param {Object} schema 
     * @param {Number} filter_obj 
     * 
     * @returns {Object} filtered schema
     */
    function _filter(schema, filter_obj) {

        if (typeof schema !== 'object') {
            return false;
        }

        // only filter leaves, skip internal nodes
        var isLeaf = Object.keys(schema).every(function (key) {
            // ignore special keys
            if (metavar_names.indexOf(key) !== -1) {
                return true;
            }
            return (typeof schema[key] !== 'object');
        });

        if (isLeaf) {
            for (fk in filter_obj) {
                if (!(fk in schema) || (schema[fk] != filter_obj[fk])) {
                    return false;
                }
            }
            return true;
        }

        // recursive call for each property
        var matchChildren = Object.keys(schema)
            
            .filter(function(key) {
                return (metavar_names.indexOf(key) === -1);
            })

            .map(function (key) {
                var res = _filter(schema[key], filter_obj);
                if (!res) {
                    delete schema[key];
                }
                return res;
            });

        if (!matchChildren.some( function (d) {return d;} )) {
            return false;
        } else {
            return true;
        }
    }

    // define defaults
    var options = options || {};
    options.flat = options.flat === null ? true : options.flat;
    options.data = options.data || false;
    options.filter = options.filter || null;
    options.metavars = options.metavars || {count: '$count', type: '$type', data: '$data', array: '$array', prob: '$prob', other: '$other'};

    var metavar_names = _getObjectValues(options.metavars);

    // remap options.metavars
    var $c = options.metavars.count,
        $t = options.metavars.type,
        $d = options.metavars.data,
        $a = options.metavars.array,
        $p = options.metavars.prob,
        $o = options.metavars.other;

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
        schema = _flatten(schema);
    }

    // filter schema
    if (options.filter !== null) {
        _filter(schema, options.filter);
    }

    return schema;
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