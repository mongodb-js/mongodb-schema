"#schema" [
  {
    "t": 3          // type
    "n": 880        // number
    "p": 0.2        // probability relative to parent
    "u": true       // unique flag
    "d": { ... }    // type-specific data
  },
  ...
]

// ### d for each type

// 1 float
"d" : {
  "min": 0,              // some stats
  "max": 1434933322,     // ..
  "avg": 1002484,        // ..
  "med": 998433,         // ..
  "v": [ ... ]           // list of values in order of traversal
}

// 2 string
"d" : {
  "min": "a",
  "max": "z",
  "v": [ ... ],          // unique set of values, order by counts
  "c": [ ... ]           // counts of values
}

// 3 subdocument
"d" : {
  // sub fields are handled in the main structure of the schema doc
}

// 4 array
"d" : {
  "#schema": [
    ...               // array introspection, distribution of elements in array like regular #schema
  ]
}

// 5 binary
"d" : {
  "sub": 4,           // subtype
}

// 6 undefined
"d" : {
}

// 7 ObjectId
"d" : {
  "min": {"$oid": "553f06eb1fc10e8d93515abb"},
  "max": {"$oid": "553f06fbbeefcf581c232257"},
  "weekdays": [1, 19, 23, 4, 6, 43, 1],
  "hours": [1, 2, 3, 4, 5, 3, 4, 3, 4, 2, 2, 5, 7, 9, 0, 6, 4, 2, 1, 2, 3, 4, 5, 6],
  "bins": {                          // adaptive binning
    "size": 86400,                   // number of seconds per bucket
    "values": [14, 4, 6, 23, ...]    // values per bin
  }
}

// 8 boolean
"d" : {
  "true": 48,       // counts
  "false": 13,      // ..
}

// 9 datetime
"d" : {
  "min": {"$date": 1434933322},
  "max": {"$date": 1434939935},
  "weekdays": [1, 19, 23, 4, 6, 43, 1],
  "hours": [1, 2, 3, 4, 5, 3, 4, 3, 4, 2, 2, 5, 7, 9, 0, 6, 4, 2, 1, 2, 3, 4, 5, 6],
  "bins": {                         // adaptive binning
    "size": 30758400,               // number of seconds per bucket
    "values": [14, 4, 6, 23]        // values per bin
  }
}

// 10 null
"d" : {
}

// 11 regex
"d" : {
}

// 12 dbpointer
"d" : {
}

// 13 javascript code
"d" : {
}

// 15 javascript code with scope
"d" : {
}

// 16 int-32
"d" : {
  "min": 3,
  "max": 883,
  "med": 145,
  "avg": 168,
  "v": [ ... ],      // unique set of values, order by values
  "c": [ ... ]       // counts of values
}

// 17 timestamp
"d" : {

}

// 18 int-64
"d" : {
  "min": 3,
  "max": 883,
  "med": 145,
  "avg": 168,
  "v": [ ... ],       // unique set of values, order by values
  "c": [ ... ]        // counts of values
}

// 127 minkey
"d" : {
}

// 255  maxkey
"d" : {
}


// ---------------------------------------------


// Example: parsing these 3 documents ...
{ bla : 4 }
{ foo : "hello world" }
{ foo : { bar: 1, baz: [1, 2, 3] } }


// ... produces this schema
{
  "#root": {
    "n": 3,           // total count
    "v": "0.7.0",     // schema representation version
  },
  "bla": {
    "#schema": [
      {
        "t": 16,
        "n": 1,
        "p": 0.33333333,
        "u": true,
        "d": {
          "min": 4,
          "max": 4,
          "med": 4,
          "avg": 4,
          "v": [4],
          "c": [1]
        }
      },
      {
        "t": 6,
        "n": 2,
        "p": 0.6666666667,
        "u": false,
        "d": {}
      }
    ]
  },
  "foo": {
    "#schema": [
      {
        "t": 3,    // type "sub-document"
        "n": 1,
        "p": 0.33333333,
        "u": true,
        "d": {}
      },
      {
        "t": 6,    // type "undefined"
        "n": 1,
        "p": 0.33333333,
        "u": true,
        "d": {}
      },
      {
        "t": 2,    // type string
        "n": 1,
        "p": 0.33333333,
        "u": true,
        "d":
          "min": "hello world",
          "max": "hello world",
          "v": ["hello world"],      // unique set of values, order by counts
          "c": [1]                   // counts of values
        }
      }
    ],
    "bar": {             // note, this is inside the "foo" document
      "#schema": [
        {
          "t": 16,        // type "int-32"
          "n": 1,
          "p": 1.0,      // this is relative to its parent "foo" being a subdocument
          "u": true,
          "d": {
            "min": 1,
            "max": 1,
            "med": 1,
            "avg": 1,
            "v": [1],
            "c": [1]
          }
        }
      ]
    },
    "baz": {
      "#schema": [
        {
          "t": 4,
          "n": 1,
          "p": 1.0,
          "u": true,
          "d": {
            "#schema": [
              {
                "t": 16,      // type "int-32"
                "n": 3,
                "p": 3.0,     // here p is equivalent to the average number of array elements
                "u": true,    // this indicates that it could be a set, rather than an array
                "d": {
                  "min": 1,
                  "max": 3,
                  "med": 2,
                  "avg": 2,
                  "v": [1, 2, 3],
                  "c": [1, 1, 1]
                }
              }
            ]
          }
        }
      ]
    }
  }
}
