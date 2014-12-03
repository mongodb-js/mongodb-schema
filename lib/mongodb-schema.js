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
                if (((typeof obj[o]) === 'object') && ([$t, $h, $s].indexOf(o) === -1)) {
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

        // special case: explicit nulls get their own type
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
                    // no need to infer data, has happened during collapsing already
                    return;
                } else {
                    // objects need to be handled recursively
                    _infer(schema[key], val);
                }

                // handle data inference if single type
                if (options.data && (Object.keys(schema[key][$t]).length === 1)) {
                    
                    if (!($s in schema[key])) {
                        schema[key][$s] = {};
                    }
                    if (!($h in schema[key])) {
                        schema[key][$h] = [];
                    }
                    var s = schema[key][$s];
                    var h = schema[key][$h];

                    // collect $hist data for most types
                    if ((typeof val === 'string') || 
                        (typeof val === 'number') ||
                        (typeof val === 'boolean') ||
                        (typeof val === 'object' && val instanceof Date)) {

                        // find array element for val (this would be more efficient with a dictonary, 
                        // but can't store arbitary types as keys)
                        var el = _findFirst(h, function(el) { return el.v === val; });
                        if (el !== null) {
                            el.c ++;
                        } else {
                            if (h.length < options.data.maxCardinality) {
                                h.push({v:val, c:1});
                            } else {
                                var o = _findFirst(h, function(el) { return el.o !== undefined; });
                                if (o !== null) {
                                    o.o ++;    
                                } else {
                                    h.push({o: 1});
                                }
                            }
                        }
                    }

                    // collect $stats data for numbers and dates
                    switch (typeof val) {
                        // numbers: additionally calculate min and max
                        case 'number':
                            if (!('min' in s)) s['min'] = Infinity;
                            if (!('max' in s)) s['max'] = -Infinity;
                            s['min'] = (val < s['min']) ? val : s['min']; 
                            s['max'] = (val > s['max']) ? val : s['max']; 
                            break;
                        case 'object':
                            // dates: additionally calculate min and max date
                            if (val instanceof Date) {
                                if (!('min' in s)) s['min'] = new Date(100000000*86400000);
                                if (!('max' in s)) s['max'] = new Date(-100000000*86400000); 
                                s['min'] = (val.getTime() < s['min'].getTime()) ? val : s['min']; 
                                s['max'] = (val.getTime() > s['max'].getTime()) ? val : s['max']; 
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

        // if single type, collapse to {$type: '...'}
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

        // calculate relative probabilities
        if (schema[$c] !== undefined) {
            if (count) {
                schema[$p] = schema[$c] / count;
            }
            count = schema[$c];
        }

        if (schema[$s] !== undefined) {
            // remove data for inner nodes
            if (!($t in schema)) {
                delete schema[$s];
                delete schema[$h];
            }

            // remove mixed data
            if (typeof schema[$t] === 'object') {
                delete schema[$s];
                delete schema[$h];
            }

            // remove null data
            if (schema[$t] === 'null') {
                delete schema[$s];
                delete schema[$h];
            }

            // remove stats data for anything but dates and strings
            if (schema[$t] !== 'number' && schema[$t] !== 'date') {
                delete schema[$s];
            }

            // check for categories
            if (schema[$h] !== undefined) {
                // check for uniqueness
                var counts = schema[$h].filter(function (el) { return el.v !== undefined; } ).map(function (el) { return el.c; });
                var maxCount = Math.max.apply( null, counts );
                if (maxCount === 1 || counts.length === 1) {
                    delete schema[$h];
                } else {
                    schema[$k] = true;
                }
            }
        }
            
        // recursive call for each property
        Object.keys(schema).forEach(function (key) {
            _cleanup(schema[key], count);
        });

        return schema;
    }


    function _uncleanup(schema) {
        if (typeof schema !== 'object') {
            return schema;
        }

        // nest single type under {$type: ...}
        if (schema[$t] !== undefined) {
            if (typeof schema[$t] !== 'object') {
                var obj = {};
                obj[schema[$t]] = schema[$c];
                schema[$t] = obj;
            }
        }

        // remove $category
        if (schema[$k] !== undefined) {
            delete schema[$k];
        }

        // remove $prop 
        if (schema[$p] !== undefined) {
            delete schema[$p];
        }

        // recursive call for each property
        Object.keys(schema).forEach(function (key) {
            _uncleanup(schema[key]);
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
     * merges the attributes and values from obj into the defaults object 
     * and returns the result.
     * 
     * @param {Object} defaults
     * @param {Object} obj
     *
     * @returns {Object} merged object
     */
    function _mergeDefaults(defaults, obj) {
        for (var key in obj) {
            if (!obj.hasOwnProperty(key)) {
                continue;
            }
            defaults[key] = obj[key];
        }
        return defaults;
    }

    /**
     * walks through an array and returns the first element that matches 
     * a provided test condition.
     * 
     * @param {Array} arr
     * @param {Function} test Returns true if search condition is met
     * @param {Object} ctx Context to evaluate, optional
     *
     * @returns {Any} first element to match the condition
     */
    function _findFirst(arr, test, ctx) {
        var result = null;
        arr.some(function(el, i) {
            return test.call(ctx, el, i, arr) ? ((result = el), true) : false;
        });
        return result;
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
    options.raw = options.raw || false;
    options.flat = options.flat === null ? true : options.flat;
    options.data = options.data || false;
    options.filter = options.filter || null;
    options.merge = options.merge || false;
    options.metavars = _mergeDefaults({
        prefix: '$',
        count: 'count', 
        type: 'type', 
        stats: 'stats', 
        array: 'array', 
        prob: 'prob', 
        histogram: 'hist',
        category: 'category'
    }, options.metavars);

    // add prefix
    for (var key in options.metavars) {
        if (key === 'prefix') {
            continue;
        }
        options.metavars[key] = options.metavars.prefix + options.metavars[key];
    }

    var metavar_names = _getObjectValues(options.metavars);

    // remap options.metavars
    var $c = options.metavars.count,
        $t = options.metavars.type,
        $s = options.metavars.stats,
        $a = options.metavars.array,
        $p = options.metavars.prob,
        $h = options.metavars.histogram,
        $k = options.metavars.category;

    // nested options.data 
    if (options.data) {

        if (options.merge && !options.raw) {
            throw "Cannot merge final schema with `data` option. Disable `data` or use `raw` mode for all inferences.";
        }

        if (typeof options.data !== 'object') {
            options.data = {};
        }
        options.data.maxCardinality = options.data.maxCardinality || 100;
    }
    
    // infer schema of each document
    if (options.raw) {
        if (options.merge && options.merge.raw_schema === undefined) {
            throw "Raw mode requires a schema in `raw` format. Use {raw: true} for all calls to schema()";
        }
        var schema = options.merge.raw_schema || {};
    } else {
        var schema = options.merge ? _uncleanup(options.merge) : {};
    }

    documents.forEach(function (doc) {
        schema = _infer(schema, doc);
    });

    // clean up schema if not in raw mode
    if (!options.raw) {
        schema = _cleanup(schema);
    }

    // return deep or flat version
    if (options.flat) {
        schema = _flatten(schema);
    }

    // filter schema
    if (options.filter !== null) {
        _filter(schema, options.filter);
    }

    if (options.raw) {
        // piggyback cleanup function on raw output
        return {
            raw_schema: schema,
            cleanup: function() {
                 return _cleanup(schema);     
            }
        }
    }

    return schema;
}

/**
 * extend the DBCollection object to provide the .schema() method
 * 
 * @param {Object} options supports two options: {samples: 123, flat: true}
 *
 * @returns {Object} the schema document with various meta variables, like $count, $type, ...
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