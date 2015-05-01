// adapted from: https://realprogrammer.wordpress.com/2013/02/10/mongodb-and-node-js-part-1-list-of-documents-for-all-types/

// writes documents of each bson type to a MongoDB instance running at localhost:27027 in the test.types collection

var MongoDB = require('mongodb');

/*
 Type codes
 ==========
 1 "\x01" e_name double             Floating point
 2 "\x02" e_name string             UTF-8 string
 3 "\x03" e_name document           Embedded document
 4 "\x04" e_name document           Array
 5 "\x05" e_name binary             Binary data

 7 "\x07" e_name (byte*12)          ObjectId
 8 "\x08" e_name "\x00"             Boolean "false"
 8 "\x08" e_name "\x01"             Boolean "true"
 9 "\x09" e_name int64              UTC datetime
 10 "\x0A" e_name Null value
 11 "\x0B" e_name cstring cstring   Regular expression

 13 "\x0D" e_name string            JavaScript code

 15 "\x0F" e_name code_w_s          JavaScript code w/ scope
 16 "\x10" e_name int32             32-bit Integer
 17 "\x11" e_name int64             Timestamp
 18 "\x12" e_name int64             64-bit integer
 255 "\xFF" e_name Min key
 127 "\x7F" e_name Max key

 Deprecated type codes
 =====================
 6 "\x06" e_name                    Undefined — Deprecated
 12 "\x0C" e_name string (byte*12)  DBPointer — Deprecated
 14 "\x0E" e_name string            Symbol — Deprecated

 */

var typeDocuments;

typeDocuments = [
    {"x": new MongoDB.Double(123.123),
        "comment": "new MongoDB.Double(123.123)",
        "btype": 1},
    {"x": 456.456,
        "comment": "456.456",
        "btype": 1},
    {"x": "abc",
        "comment": "abc",
        "btype": 2},
    {"x": {"z": 5},
        "comment": "{\"z\": 5}",
        "btype": 3},
    // this is not type:4
    {"x": [9, 8, 7],
        "comment": "[9, 8, 7]",
        "btype": 16},
    {"x": [
        {"y": 4},
        {"z": 5}
    ], "comment": "[{\"y\": 4}, {\"z\": 5}]",
        "btype": 3},
    {"x": new MongoDB.Binary("binary"),
        "comment": "new MongoDB.Binary(\"binary\")",
        "btype": 5},
    // t:6 deprecated (was 'undefined') - not implemented
    {"x": new MongoDB.ObjectID("5040dc5d40b67c681d000001"),
        "comment": "new MongoDB.ObjectID(\"5040dc5d40b67c681d000001\")",
        "btype": 7},
    {"x": false,
        "comment": "false",
        "btype": 8},
    {"x": true,
        "comment": "true",
        "btype": 8},
    {"x": new Date("2012-08-31 12:13:14:156 UTC"),
        "comment": "new Date(\"2012-08-31 12:13:14:156 UTC\")",
        "btype": 9},
    {"x": null,
        "comment": "null",
        "btype": 10},
    {"x": new RegExp("abc"),
        "comment": "new RegExp(\"abc\")",
        "btype": 11},
    {"x": new RegExp("abc", "i"),
        "comment": "new RegExp(\"abc\", \"i\")",
        "btype": 11},
    // t:12 DBRef deprecated - still implemented
    // this is not type:12
    {"x": new MongoDB.DBRef("types", "040dc5d40b67c681d000001", "types"),
        "comment": "new MongoDB.DBRef(\"types\", \"5040dc5d40b67c681d000001\", \"types\")",
        "btype": 3},
    {"x": new MongoDB.Code("function () { return 'test'; }"),
        "comment": "new MongoDB.Code(\"function () { return ' test'; }\")",
        "btype": 13},
    // t:14 Symbol deprecated - still implemented
    {"x": new MongoDB.Symbol("def15"),
        "comment": "new MongoDB.Symbol(\"def15\")",
        "btype": 14},
    {"x": new MongoDB.Code("function () { return a; }", {"a": 4}),
        "comment": " new MongoDB.Code(\"function () { return a; }\", {\"a\": 4})",
        "btype": 15},
    {"x": 123456,
        "comment": "123456",
        "btype": 16},
    {"x": new MongoDB.Timestamp(1, 2),
        "comment": "new MongoDB.Timestamp(1, 2)",
        "btype": 17},
    {"x": new MongoDB.Long("9876543210"),
        "comment": "new MongoDB.Long(\"9876543210\")",
        "btype": 18},
    {"x": new MongoDB.MinKey(),
        "comment": "new MongoDB.MinKey()",
        "btype": 255},
    {"x": new MongoDB.MaxKey(),
        "comment": "new MongoDB.MaxKey()",
        "btype": 127},
    // ADDITIONAL POSSIBLE VALUES
    // 'undefined' will be converted to 'null'; type will be 'null' (aka 10) also
    {"x": undefined,
        "comment": "undefined",
        "btype": 10},
    {"x": Number.NaN,
        "comment": "Number.NaN",
        "btype": 1},
    {"x": Infinity,
        "comment": "Infinity",
        "btype": 1},
    {"x": Number.POSITIVE_INFINITY,
        "comment": "Number.POSITIVE_INFINITY",
        "btype": 1},
    {"x": Number.NEGATIVE_INFINITY,
        "comment": "Number.NEGATIVE_INFINITY",
        "btype": 1},
    {"x": Number.MIN_VALUE,
        "comment": "MIN_VALUE",
        "btype": 1},
    {"x": Number.MAX_VALUE,
        "comment": "MAX_VALUE",
        "btype": 1}
];

var Db = MongoDB.Db,
    Server = MongoDB.Server;
var db = new Db('test', new Server("127.0.0.1", 27017,
    {auto_reconnect: false, poolSize: 4}), {native_parser: false, safe: false});

db.open(function (err, db) {
    "use strict";
    db.dropCollection("types", function (err, result) {
        if (err) {
            console.log(err.toString());
        }
        console.log("dropped collection");
        db.collection("types", function (err, collection) {
            collection.insert(typeDocuments, {safe: true}, function (err, res) {
                if (err) {
                    console.log(err.toString());
                }
                console.log("inserted all types into test.types");
                db.close();
            });
        });
    });
});
