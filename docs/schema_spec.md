### Scout Specification
# Schema Representation

Author: Matt Kangas, Thomas Rueckstiess<br>
Last Revised: 2015-04-29<br>
Status: Draft<br>

## Specification


### 0. Definitions

Whe talk about _documents_ when we mean the data stored in MongoDB (a collection has many documents), but we talk about an _object_, when we mean the JSON representation of a document. For both documents and objects, we will adopt the JSON taxonomy ([json.org]()), where the document/object consists of _members_ and each member is a _name_/_value_ pair.

> ##### Example

> An object with 2 members. The name of the first member is `foo` and the name of the second member is `bar`. Both member values are 1.

>     {"foo": 1, "bar": 1}



### 1. Escape Character

We shall define `#` (ASCII 0x23) as an _escape character_ to distinguish meta data members from members originating from sampled data.

Rationale:

- expressible in one byte of UTF-8 (ASCII)
- Non-numeric (not in `0`..`9`, ASCII range 0x30-0x39), because this conflicts with javascript objects/arrays)
- Not `$` (ASCII character 0x24), because it is not a valid prefix for member names in MongoDB

We shall then encode member names as follows:

- Member name begins with no escape character:
literal member name
- Member name begins with single escape character:
encoded metadata member
- Member name begins with double escape character:
literal member name which begins with single escape character


### 2. General Structure

We define a _sample set_ as a number of MongoDB documents from a single collection. The documents may have been selected in random fashion, but this definition does not impose any restrictions on the method of acquiring the documents. The documents comprising the sample set are called _sample documents_.

We define the _shape_ of a sample set as aggregated characteristics of all members of the documents in the sample set. These characteristics are further described below.

We define a _schema_ as a JSON representation of the _shape_ of a sample set.

The schema must be strict, valid [JSON](http://www.json.org/). MongoDB-specific types must be converted into strict JSON as per [MongoDB's extended JSON](http://docs.mongodb.org/manual/reference/mongodb-extended-json/) definition, "strict" variant.

The schema follows the combined structure of all documents in the sample set. This means, that for every member in any sample document, a member with the same name exists in the schema at the same nesting depth. This rule applies to members at all nesting depths. The schema can thus be seen as a superposition of all sample documents.

Within the schema, the value of any such member is an object. This is explicitly also true for leaf members in a sample document, i.e. values that are neither arrays (BSON type 4) nor nested documents (BSON type 3). Every such object contains an encoded meta-data member with the name `#schema` (note the escape character), in addition to potential nested children. This meta-data member with the name `#schema` is called a _tag_, and its value is an array that contains one element for each [BSON type](http://bsonspec.org/spec.html) encountered in the sample set for this particular member.


> ##### Example

> Sample set:

>     {a: "foo"}
>     {a: {b: 10, c: true}}
>     {c: null}

> Schema (with `...` placeholders for the tag arrays)

>     {
>       "a": {
>         "#schema": [...],     // tag for a
>         "b": {
>           "#schema": [...],   // tag for a.b
>         },  
>         "counts": {
>           "#schema": [...],   // tag for a.c
>         }
>       },
>       "counts": {
>         "#schema": [...],     // tag c
>       }
>     }

### 3. Tags

While the schema object itself describes the overall structure of the sample set, the aggregated characteristics of each member are contained within its tag.

The tag array contains one element for each distinct type encountered in the sample set for the given field. The order of this array is not defined and considered an implementation detail. If a field is missing in a sample document, it is treated as type _undefined_, and we use the (deprecated) BSON type 6 to represent it.

Each element in the array is an object with the following members:

- `type`: integer representing the (decimal) BSON type, unique within each schema tag
- `number`: integer representing the number of documents encountered in the sample set that contain this field
- `prob`: float representing the (relative) probability of this field being present given its parent field is present
- `unique`: boolean representing whether or not the values of this field are unique under the given type
- `data`: object containing type-specific additional data


> ##### Example

> Field with its tag (`...` is placeholder for type-specific data field)

>     "a": {
>       "#schema": [       // tag for a
>         {
>           "type": 2,        // "string" type
>           "number": 160,      // 160 encounters
>           "prob": 0.8,      // relative probability 0.8 means 200 parent objects
>           "unique": false,    // the values contain duplicates
>           "data": {...}     // placeholder, defined further below
>         },
>         {
>           "type": 3,        // "nested document" type
>           ...
>         }
>       ]
>     }


### 4. Type-Specific Data

Inside a tag, each element is specified uniquely by its type, represented in the `t` member and its decimal value which corresponds with the BSON type. For each BSON type, this section defines a structure for the `data` member, which carries additional information specific for the type.


#### Type 1: float

The `data` object contains the following members:

- `min`: The smallest value encountered in any sample document
- `max`: The largest value encountered in any sample document
- `avg`: The mean of all sample document values
- `med`: The median of all sample document values
- `values`: An array of all values encountered, in order of traversal


> ##### Example

>     "data": {
>       "min": 0.0
>       "max": 32.8,
>       "avg": 9.3499999,
>       "med": 5.25,
>       "values": [ 0.0, 1.4, 6.4, 3.2, 8.6, 18.3, 32.8, 4.1 ]
>     }


#### Type 2: string


The `data` object contains the following members:

- `min`: The smallest value encountered in any sample document
- `max`: The largest value encountered in any sample document
- `values`: Unique set of all values encountered, ordered by counts descending
- `counts`: count for each value, same order as above


> ##### Example

>     "data": {
>       "min": "atlas",
>       "max": "zoo",
>       "values": [ "atlas", "song", "bird", "zoo", "breakfast" ],
>       "counts": [ 15, 9, 7, 5, 2 ]
>     }


#### Type 3: nested document

The `data` object for nested document types is empty. All information about child members is tracked in the respective nested member tag.


#### Type 4: array

The `data` object for arrays contains an `#array` member. It follows the structure of a regular `#schema` tag, but applies to elements inside arrays only. This concept is called _array introspection_.

> ##### Example

> This array contains only strings (there is only a single element with type `2` in the `#schema` array). This element follows the normal rules for string types, as described above.

>     "data": {
>       "#array": [
>         {
>           "type": 2,
>           "number": 490,
>           "prob": 1.0,
>           "unique": false,
>           "data": {
>             "min": "AUH",
>             "max": "ZRH",
>             "values": [ "NYC", "CDG", "FRA", "LHR", "ZRH", "AUH", "BKK", "LAX" ],
>             "counts": [ 171, 110, 82, 40, 29, 23, 21, 14 ]
>           }
>         }
>       ]
>     }


#### Type 5: binary

The `data` object contains a distribution of subtypes under the type binary. The `sub` member is an array of sub-types, and the `counts` member is an array of counts of the encountered sub-types.

> ##### Example

>     "data": {
>       "sub": [ 4, 3 ]
>       "counts": [ 3004, 2554 ]
>     }


#### Type 6: undefined (deprecated)

The `data` object is empty.


#### Type 7: ObjectId

The `data` object contains the following fields:

- `min`: The smallest ObjectId value found, encoded as strict extended JSON.
- `max`: The largest ObjectId value found, encoded as strict extended JSON.

Additionally, because ObjectId has a timestamp encoded into its first 6 bytes, the `data` field further contains aggregated date and time information:

- `weekdays`: An array of 7 elements, counting the ObjectIds created on respective week days, starting with Monday.
- `hours`: An array of 24 elements, counting the ObjectIds created in respective hours, starting with (00-01h, or 12am-1am).
- `bins`: This is an adaptive binning object, containing information about the bin size and the value distribution per bin. See below under `adaptive binning` for more information.

> ##### Example

>     "data": {
>       "min": {"$oid": "553f06eb1fc10e8d93515abb"},
>       "max": {"$oid": "553f06fbbeefcf581c232257"},
>       "weekdays": [1, 19, 23, 4, 6, 43, 1],
>       "hours": [1, 2, 3, 4, 5, 3, 4, 3, 4, 2, 2, 5, 7, 9, 0, 6, 4, 2, 1, 2, 3, 4, 5, 6],
>       "bins": {
>         "size": 86400,
>         "values": [14, 4, 6, 23, ...],
>         "labels": []
>       }
>     }


#### Type 8: boolean

The `data` field contains the distribution of `true` and `false` values.

> ##### Example

>     "data": {
>       "true": 48,
>       "false": 13,
>     }


#### Type 9: datetime

the `data` field contains aggregated date and time information:

- `weekdays`: An array of 7 elements, counting the ObjectIds created on respective week days, starting with Monday.
- `hours`: An array of 24 elements, counting the ObjectIds created in respective hours, starting with (00-01h, or 12am-1am).
- `bins`: This is an adaptive binning object, containing information about the bin size and the value distribution per bin. See below under `adaptive binning` for more information.

> ##### Example

>     "data": {
>       "min": {"$date": 1434933322},
>       "max": {"$date": 1434939935},
>       "weekdays": [1, 19, 23, 4, 6, 43, 1],
>       "hours": [1, 2, 3, 4, 5, 3, 4, 3, 4, 2, 2, 5, 7, 9, 0, 6, 4, 2, 1, 2, 3, 4, 5, 6],
>       "bins": {
>         "size": 30758400,
>         "values": [14, 4, 6, 23]
>       }
>     }


#### Type 10: null

The `data` object is empty.

#### Type 11: regular expression

The `data` object is empty.

#### Type 12: DBPointer (deprecated)

The `data` object is empty.

#### Type 13: javascript code

The `data` object is empty.

#### Type 15: javascript code with scope

The `data` object is empty.

#### Type 16: 32-bit integer

The `data` object contains the following members: 

- `min`: The minimum value encountered
- `max`: The maximum value encountered
- `med`: The median of all encoutered values
- `avg`: The mean of all encountered values
- `values`: Unique set of all values encountered, ordered by values
- `counts`: count for each value, same order as above

> ##### Example

>     "data" : {
>       "min": 3,
>       "max": 72,
>       "med": 20,
>       "avg": 30.5,
>       "values": [ 19, 21, 24, 25, 28, 29, 30, 31, 36, 45, 58, 59, 72],   
>       "counts": [ 3, 4, 8, 12, 13, 15, 21, 20, 19, 20, 16, 12, 7 ]
>     }

#### Type 17: timestamp

the `data` field contains aggregated date and time information:

- `weekdays`: An array of 7 elements, counting the ObjectIds created on respective week days, starting with Monday.
- `hours`: An array of 24 elements, counting the ObjectIds created in respective hours, starting with (00-01h, or 12am-1am).
- `bins`: This is an adaptive binning object, containing information about the bin size and the value distribution per bin. See below under `adaptive binning` for more information.

> ##### Example

>     "data": {
>       "min": {"$date": 1434933322},
>       "max": {"$date": 1434939935},
>       "weekdays": [1, 19, 23, 4, 6, 43, 1],
>       "hours": [1, 2, 3, 4, 5, 3, 4, 3, 4, 2, 2, 5, 7, 9, 0, 6, 4, 2, 1, 2, 3, 4, 5, 6],
>       "bins": {
>         "size": 30758400,
>         "values": [14, 4, 6, 23]
>       }
>     }


#### Type 18: 64-bit integer

The `data` object contains the following members: 

- `min`: The minimum value encountered
- `max`: The maximum value encountered
- `med`: The median of all encoutered values
- `avg`: The mean of all encountered values
- `values`: Unique set of all values encountered, ordered by values
- `counts`: count for each value, same order as above

> ##### Example

>     "data" : {
>       "min": 3,
>       "max": 72,
>       "med": 20,
>       "avg": 30.5,
>       "values": [ 19, 21, 24, 25, 28, 29, 30, 31, 36, 45, 58, 59, 72],   
>       "counts": [ 3, 4, 8, 12, 13, 15, 21, 20, 19, 20, 16, 12, 7 ]
>     }

#### Type 255: minkey

The `data` object is empty.

#### Type 127: maxkey

The `data` object is empty.


### 5. Adaptive Binning

Some data types contain a field `bins`, where the data is discretized into bins with a variablebin size, depending on the data distribution. 

A _bin_ is defined 

The `bins` object consists of the following members:

- `size`: this is the size of an individual bin. For numbers (types 1, 16, 18), this is a unitless number that describes the size of a bin. 


>       "bins": {                          // adaptive binning
>         "size": 86400,                   // number of seconds per bucket
>         "values": [14, 4, 6, 23, ...]    // values per bin
>         "labels": ["Apr 30", "May 1", "May 2", "May 3", ...]
>       }
