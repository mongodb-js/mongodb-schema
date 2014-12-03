var schema = require('../').schema,
    schema_sync = require('../').schema_sync;

var assert = require('assert');


describe('mongodb-schema', function() {

    var docs = [
        {
            a: "foo", 
            b: [1, 2, 3], 
            c: true,
            d: new Date(2014, 1, 1),
            e: null,
            f: "foo"              
        },
        {
            a: "bar", 
            b: 2, 
            c: false,
            d: new Date(2013, 1, 1),
            e: null,
            f: "foo"          
        },
        {
            a: "baz", 
            b: 8, 
            c: false,
            d: new Date(2012, 1, 1),
            e: null,
            f: "bar"          
        }
    ];

    describe('basic', function () {

        it('should import correctly', function () {
            assert.ok(schema);
            assert.ok(schema_sync);
        });    

        it('should work with a simple document', function () {
            var result = schema_sync([{a: 1, b: 1}]);
            var expected = { 
                "$count":1,
                "a": {
                    "$count": 1,
                    "$type": "number",
                    "$prob": 1
                },
                "b": {
                    "$count": 1,
                    "$type": "number",
                    "$prob": 1
                }
            };
            assert.deepEqual(result, expected);
        });

        it('should return a type histogram for mixed types', function () {
            var result = schema_sync([
                {a: 1}, {a: "1"}, {a: null}, {a: "1"}, {a: {b: 1}}, {a: 1}, {a: "1"}
            ]);

            var expected = {
                "number": 2,
                "string": 3,
                "null": 1,
                "object": 1
            };
            assert.deepEqual(result.a['$type'], expected);
        });

        it('should work with an empty list of documents', function () {
            var result = schema_sync([]);
            assert.deepEqual(result, {});
        });

        it('should infer types correctly (not testing ObjectId currently)', function () {
            var result = schema_sync(docs);

            assert.equal(result.a['$type'], 'string');
            assert.equal(result.b['$type'], 'number');
            assert.equal(result.c['$type'], 'boolean');
            assert.equal(result.d['$type'], 'date');
            assert.equal(result.e['$type'], 'null');
            assert.equal(result.f['$type'], 'string');
        });

        it('should correctly parse nested documents', function () {
            var result = schema_sync([
                {a: {b: 1}},
                {a: {b: {c: 2}}},          
            ]);

            var expected = {
                "$count": 2,
                "a": {
                    "$count": 2,
                    "b": {
                        "$count": 2,
                        "$type": {
                            "number": 1,
                            "object": 1
                        },
                        "c": {
                            "$count": 1,
                            "$type": "number",
                            "$prob": 0.5
                        },
                        "$prob": 1
                    },
                    "$prob": 1
                }
            };

            assert.deepEqual(result, expected);
        });

        it('should count sub-fields correctly', function () {
            var result = schema_sync([
                {a: 1, b: 1}, 
                {a: 1, c: 1},
                {a: 1, b: 1}
            ]);

            assert.equal(result['$count'], 3);
            assert.equal(result.a['$count'], 3);
            assert.equal(result.b['$count'], 2);
            assert.equal(result.c['$count'], 1);
        });

    });


    describe('configuration', function () {

        it('should flatten the schema with the {flat: true} option', function () {
            var result = schema_sync([
                {a: {b: 1}},
                {a: 2}
            ], {flat: true});

            assert(result['a'] !== undefined);
            assert(result['a.b'] !== undefined);
            assert(result['a']['b'] === undefined);
        });

        it('should let you change the meta-variable names', function () {
            var result = schema_sync([
                {a: "a"}, {a: "a"}, {a: "b"}, {a: ["c"]}, {a: "d"}, {a: "e"}, {a: "f"}
            ], { 
                data: { maxCardinality: 3 }, 
                metavars: { prefix: '#', count: 'num', prob: 'p' }
            });

            assert(result.a['#num'] !== undefined);
            assert(result.a['#type'] !== undefined);
            assert(result.a['#p'] !== undefined);
            assert(result.a['#array'] !== undefined);
        });

    });

    describe('data inference', function () {

        it('should not break with empty arrays for data inference', function () {
            var result = schema_sync([
                {a: []}
            ], {data: true});
        });

        it('should infer data for collapsed arrays', function () {
            var result = schema_sync([
                {a: [1, 2, 3, 4]}, 
                {a: [5, 6]}
            ], {data: true});

            var expected = {
                min: 1,
                max: 6
            }; 
            
            assert.deepEqual(result.a['$stats'], expected);
        }); 

        it('should infer type and set `category` flag correctly', function () {
            var result = schema_sync(docs, {data: true});

            // string, not category
            assert.equal(result.a['$type'], 'string');
            assert.ok( ! result.a['$category']);

            // number, category
            assert.equal(result.b['$type'], 'number');
            assert.ok(result.b['$category']);

            // boolean, category
            assert.equal(result.c['$type'], 'boolean');
            assert.ok(result.c['$category']);

            // date, not category
            assert.equal(result.d['$type'], 'date');
            assert.ok( ! result.d['$category']);

            // null, not category
            assert.equal(result.e['$type'], 'null');
            assert.ok( ! result.e['$category']);

            // string, category
            assert.equal(result.f['$type'], 'string');
            assert.ok(result.f['$category']);
        });


        it('should calculate bounds for date/number and histograms for category', function () {
            var result = schema_sync(docs, {data: true});

            assert.ok( !('$stats' in result.a) );
            assert.ok( !('$stats' in result.c) );
            assert.ok( !('$stats' in result.e) );

            assert.deepEqual(result.b['$stats'], {
                min: 1, 
                max: 8
            });
            assert.deepEqual(result.d['$stats'], {
                min: new Date(2012, 1, 1),
                max: new Date(2014, 1, 1)
            });
            assert.deepEqual(result.f['$hist'], [ {v: "foo", c: 2}, {v: "bar", c: 1} ]);
        });

        it('should collect categories in $other when maxCardinality is reached', function () {
            var result = schema_sync([
                {a: "a"}, {a: "a"}, {a: "b"}, {a: "c"}, {a: "d"}, {a: "e"}, {a: "f"}
            ], {data: {maxCardinality: 3}});

            assert.equal(result.a['$hist'].filter(function (el) { return 'o' in el; }).length, 1);
        });


        it('should track $data for arrays', function () {
            var result = schema_sync([
                {a: ["foo", "foo", "bar"]},
                {a: ["bar", "baz", "foo"]}
            ], {data: true});

            var expected = [{v: "foo", c: 3}, {v: "bar", c: 2}, {v: "baz", c: 1}]; 

            assert.deepEqual(result.a['$hist'], expected);
        });

        it('should not infer data for mixed numbers and dates', function () {
            var result = schema_sync([
                {a: 1},
                {a: 5}, 
                {a: new Date(2014, 08, 20)}
            ], {data: true});

            assert.ok( !('$data' in result.a) );
        });

    });



    describe('arrays', function () {
        it('should collapse arrays, set the $array flag and increase $count numbers', function () {
            var result = schema_sync([
                {a: [1, 2, 3, 4]}, 
                {a: [5, 6]}
            ]);

            var expected = {
                "$count": 2,
                "a": {
                    "$count": 6,
                    "$type": "number",
                    "$array": true,
                    "$prob": 3
                }
            };

            assert.deepEqual(result, expected);
        });   

        it('should handle mixed types for arrays', function () {
            var result = schema_sync([
                {a: ["foo", 1, "bar"]},
                {a: ["bar", null, new Date(2014, 1, 1)]}
            ], {data: true});

            var expected = {
                "string": 3,
                "number": 1,
                "date": 1,
                "null": 1
            };

            assert.deepEqual(result.a['$type'], expected);
        }); 
    });

    describe('merging', function () {
        it('should accept an existing schema and merge with new documents {data:false}', function () {
            var result = schema_sync([
                {a: 1}
            ]);   

            result = schema_sync([
                {a: 2}
            ], {merge: result});

            assert.equal(result['$count'], 2);
            assert.equal(result.a['$count'], 2);
        }); 

        it('should merge existing data correctly, {data: true, raw: true}', function() {
            var result = schema_sync([
                {a: "foo"}, {a: "foo"}, {a: "bar"}, {a: "bar"}
            ], {data: true, raw: true});   

            result = schema_sync([
                {a: "foo"}, {a: "bar"}
            ], {data: true, raw: true, merge: result});

            result = result.cleanup();
            assert.deepEqual(result.a['$type'], "string");
            assert.ok(result.a['$category']);
        });

        it('should work with raw mode and output the same final result', function () {
            var result = schema_sync([{a:1}], {data: true, raw: true});
            result = schema_sync([{a:2}], {data: true, raw: true, merge: result}).cleanup();
            
            var expected = schema_sync([{a:1}, {a:2}], {data: true});

            assert.deepEqual(result, expected);
        });

    });




    describe ('async', function() {
        it('should work asynchronously and not return an error', function (done) {
            schema([{a:1, b:1}, {a:2, b:2}], {}, function (err, result) {
                if (err) throw err;
                assert.equal(err, null);
                assert.equal(result['$count'], 2);
                done();
            });
        });

        it('should return an error if `documents` is not an array', function (done) {
            schema(1, {}, function (err, result) {
                assert.ok(err);
                done();
            });            
        });
    });
});
