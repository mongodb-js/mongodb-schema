var schema = require('../').schema,
    schema_sync = require('../').schema_sync;

var assert = require('assert');


describe('mongodb-schema', function() {
    it('should import correctly', function () {
        assert.ok(schema);
        assert.ok(schema_sync);
    });    
    describe ('schema_sync', function() {

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

        it('should work with an empty list of documents', function () {
            var result = schema_sync([]);
            assert.deepEqual(result, {});
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

        it('should infer data for collapsed arrays', function () {
            var result = schema_sync([
                {a: [1, 2, 3, 4]}, 
                {a: [5, 6]}
            ], {data: true});

            var expected = {
                min: 1,
                max: 6
            }; 
            
            assert.deepEqual(result.a['$data'], expected);
        }); 

        it('should accept an existing schema and merge with new data', function () {
            var result = schema_sync([
                {a: 1}
            ], {data: true});   

            result = schema_sync([
                {a: 2}
            ], {data: true, merge: result});

            assert.equal(result['$count'], 2);
            assert.equal(result.a['$count'], 2);
            assert.deepEqual(result.a['$data'], {"min": 1, "max": 2});    

        }); 

        it('should merge existing text/category data correctly with new strings', function() {
            var result = schema_sync([
                {a: "foo"}, {a: "foo"}, {a: "bar"}, {a: "bar"}
            ], {data: true});   

            result = schema_sync([
                {a: "foo"}, {a: "bar"}
            ], {data: true, merge: result});

            assert.deepEqual(result.a['$type'], "category");

            var result = schema_sync([
                {a: "1"}, {a: "2"}, {a: "3"}, {a: "4"}
            ], {data: true});   

            result = schema_sync([
                {a: "5"}, {a: "6"}
            ], {data: true, merge: result});

            assert.deepEqual(result.a['$type'], "text");

        });

        it('should flatten the schema with the {flat: true} option', function () {
            var result = schema_sync([
                {a: {b: 1}},
                {a: 2}
            ], {flat: true});

            assert(result['a'] !== undefined);
            assert(result['a.b'] !== undefined);
            assert(result['a']['b'] === undefined);
        });

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

        it('should infer types correctly (not testing ObjectId currently)', function () {
            var result = schema_sync(docs);

            assert.equal(result.a['$type'], 'string');
            assert.equal(result.b['$type'], 'number');
            assert.equal(result.c['$type'], 'boolean');
            assert.equal(result.d['$type'], 'date');
            assert.equal(result.e['$type'], 'null');
            assert.equal(result.f['$type'], 'string');
        });

        it('should distinguish `text` and `category` types when using {data: true}', function () {
            var result = schema_sync(docs, {data: true});

            assert.equal(result.a['$type'], 'text');
            assert.equal(result.b['$type'], 'number');
            assert.equal(result.c['$type'], 'boolean');
            assert.equal(result.d['$type'], 'date');
            assert.equal(result.e['$type'], 'null');
            assert.equal(result.f['$type'], 'category');
        });

        it('should calculate bounds for date/number and histograms for category', function () {
            var result = schema_sync(docs, {data: true});

            assert.ok( !('$data' in result.a) );
            assert.ok( !('$data' in result.c) );
            assert.ok( !('$data' in result.e) );

            assert.deepEqual(result.b['$data'], {
                min: 1, 
                max: 8
            });
            assert.deepEqual(result.d['$data'], {
                min: new Date(2012, 1, 1),
                max: new Date(2014, 1, 1)
            });
            assert.deepEqual(result.f['$data'], {
                foo: 2,
                bar: 1
            });
        });

        it('should track $data for arrays', function () {
            var result = schema_sync([
                {a: ["foo", "foo", "bar"]},
                {a: ["bar", "baz", "foo"]}
            ], {data: true});

            var expected = {
                "foo": 3,
                "bar": 2,
                "baz": 1
            }

            assert.deepEqual(result.a['$data'], expected);
        });

        it('should not infer data for mixed numbers and dates', function () {
            var result = schema_sync([
                {a: 1},
                {a: 5}, 
                {a: new Date(2014, 08, 20)}
            ], {data: true});

            assert.ok( !('$data' in result.a) );
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

        it('should let you change the meta-variable names', function () {
            var result = schema_sync([
                {a: 1},
                {a: [-2, -3]}
            ], { 
                data: true, 
                metavars: { 
                    count: '#count', 
                    type: '#type', 
                    data: '#data', 
                    array: '#array', 
                    prob: '#prob' 
                } 
            });

            var expected = {
                "#count": 3,
                "#type": "number",
                "#data": {
                    "min": -3,
                    "max": 1
                },
                "#array": true,
                "#prob": 1.5
            };

            assert.deepEqual(result.a, expected);
        });

        it('should collect categories in $other when maxCardinality is reached', function () {
            var result = schema_sync([
                {a: "a"}, {a: "a"}, {a: "b"}, {a: "c"}, {a: "d"}, {a: "e"}, {a: "f"}
            ], {data: {maxCardinality: 3}});

            assert.ok('$other' in result.a['$data']);
        });

    });

    describe ('schema', function() {
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
