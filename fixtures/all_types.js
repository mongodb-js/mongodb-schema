module.exports =
[
  {
    "_id": "5543129258b9383aab07d0fb",
    "x": 123.123,
    "comment": "new MongoDB.Double(123.123)",
    "btype": 1
  },
  {
    "_id": "5543129258b9383aab07d0fc",
    "x": 456.456,
    "comment": "456.456",
    "btype": 1
  },
  {
    "_id": "5543129258b9383aab07d0fd",
    "x": "abc",
    "comment": "abc",
    "btype": 2
  },
  {
    "_id": "5543129258b9383aab07d0fe",
    "x": {
      "z": 5
    },
    "comment": "{\"z\": 5}",
    "btype": 3
  },
  {
    "_id": "5543129258b9383aab07d0ff",
    "x": [
      9,
      8,
      7
    ],
    "comment": "[9, 8, 7]",
    "btype": 16
  },
  {
    "_id": "5543129258b9383aab07d100",
    "x": [
      {
        "y": 4
      },
      {
        "z": 5
      }
    ],
    "comment": "[{\"y\": 4}, {\"z\": 5}]",
    "btype": 3
  },
  {
    "_id": "5543129258b9383aab07d101",
    "x": "YmluYXJ5",
    "comment": "new MongoDB.Binary(\"binary\")",
    "btype": 5
  },
  {
    "_id": "5543129258b9383aab07d102",
    "x": "5040dc5d40b67c681d000001",
    "comment": "new MongoDB.ObjectID(\"5040dc5d40b67c681d000001\")",
    "btype": 7
  },
  {
    "_id": "5543129258b9383aab07d103",
    "x": false,
    "comment": "false",
    "btype": 8
  },
  {
    "_id": "5543129258b9383aab07d104",
    "x": true,
    "comment": "true",
    "btype": 8
  },
  {
    "_id": "5543129258b9383aab07d105",
    "x": "2012-08-31T12:13:14.156Z",
    "comment": "new Date(\"2012-08-31 12:13:14:156 UTC\")",
    "btype": 9
  },
  {
    "_id": "5543129258b9383aab07d106",
    "x": null,
    "comment": "null",
    "btype": 10
  },
  {
    "_id": "5543129258b9383aab07d107",
    "x": {},
    "comment": "new RegExp(\"abc\")",
    "btype": 11
  },
  {
    "_id": "5543129258b9383aab07d108",
    "x": {},
    "comment": "new RegExp(\"abc\", \"i\")",
    "btype": 11
  },
  {
    "_id": "5543129258b9383aab07d109",
    "x": {
      "$ref": "types",
      "$id": "040dc5d40b67c681d000001",
      "$db": "types"
    },
    "comment": "new MongoDB.DBRef(\"types\", \"5040dc5d40b67c681d000001\", \"types\")",
    "btype": 3
  },
  {
    "_id": "5543129258b9383aab07d10a",
    "x": {
      "scope": {},
      "code": "function () { return 'test'; }"
    },
    "comment": "new MongoDB.Code(\"function () { return ' test'; }\")",
    "btype": 13
  },
  {
    "_id": "5543129258b9383aab07d10b",
    "x": "def15",
    "comment": "new MongoDB.Symbol(\"def15\")",
    "btype": 14
  },
  {
    "_id": "5543129258b9383aab07d10c",
    "x": {
      "scope": {
        "a": 4
      },
      "code": "function () { return a; }"
    },
    "comment": " new MongoDB.Code(\"function () { return a; }\", {\"a\": 4})",
    "btype": 15
  },
  {
    "_id": "5543129258b9383aab07d10d",
    "x": 123456,
    "comment": "123456",
    "btype": 16
  },
  {
    "_id": "5543129258b9383aab07d10e",
    "x": "8589934593",
    "comment": "new MongoDB.Timestamp(1, 2)",
    "btype": 17
  },
  {
    "_id": "5543129258b9383aab07d10f",
    "x": 1286608618,
    "comment": "new MongoDB.Long(\"9876543210\")",
    "btype": 18
  },
  {
    "_id": "5543129258b9383aab07d110",
    "x": {
      "_bsontype": "MinKey"
    },
    "comment": "new MongoDB.MinKey()",
    "btype": 255
  },
  {
    "_id": "5543129258b9383aab07d111",
    "x": {
      "_bsontype": "MaxKey"
    },
    "comment": "new MongoDB.MaxKey()",
    "btype": 127
  },
  {
    "_id": "5543129258b9383aab07d112",
    "x": null,
    "comment": "undefined",
    "btype": 10
  },
  {
    "_id": "5543129258b9383aab07d113",
    "x": null,
    "comment": "Number.NaN",
    "btype": 1
  },
  {
    "_id": "5543129258b9383aab07d114",
    "x": null,
    "comment": "Infinity",
    "btype": 1
  },
  {
    "_id": "5543129258b9383aab07d115",
    "x": null,
    "comment": "Number.POSITIVE_INFINITY",
    "btype": 1
  },
  {
    "_id": "5543129258b9383aab07d116",
    "x": null,
    "comment": "Number.NEGATIVE_INFINITY",
    "btype": 1
  },
  {
    "_id": "5543129258b9383aab07d117",
    "x": 5e-324,
    "comment": "MIN_VALUE",
    "btype": 1
  },
  {
    "_id": "5543129258b9383aab07d118",
    "x": 1.7976931348623157e+308,
    "comment": "MAX_VALUE",
    "btype": 1
  }
]
