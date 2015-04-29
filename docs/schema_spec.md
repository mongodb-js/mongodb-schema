### Scout Specification
# Schema Representation

Author: Matt Kangas, Thomas Rueckstiess<br>
Last Revised: 2015-04-29<br>
Status: Draft<br>

## Specification


### 0. Definitions

Whe talk about _documents_ when we mean the data stored in MongoDB (a collection has many documents), but we talk about an _object_, when we mean the JSON representation of a document. For both documents and objects, we will adopt the JSON notation ([json.org]()), where the document/object consists of _members_ and each member is a _name_/_value_ pair.

> #### Example

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


> #### Example

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
>         "c": {
>           "#schema": [...],   // tag for a.c
>         }
>       },
>       "c": {
>         "#schema": [...],     // tag c
>       }
>     }

### 3. Tags

While the schema object itself describes the overall structure of the sample set, the aggregated characteristics of each member are contained within its tag.

The tag array contains one element for each distinct type encountered in the sample set for the given field. The order of this array is not defined and considered an implementation detail. If a field is missing in a sample document, it is treated as type _undefined_, and we use the (deprecated) BSON type 6 to represent it.

Each element in the array is an object with the following members:

- `t`: (_type_) integer representing the (decimal) BSON type, unique within each schema tag
- `n`: (_number_) integer representing the number of documents encountered in the sample set that contain this field
- `p`: (_probability_) float representing the (relative) probability of this field being present given its parent field is present
- `u`: (_unique_) boolean representing whether or not the values of this field are unique under the given type
- `d`: (_data_) object containing type-specific additional data


> #### Example

> Field with its tag (`...` is placeholder for type-specific data field)

>     "a": {
>       "#schema": [       // tag for a
>         {
>           "t": 2,        // "string" type
>           "n": 160,      // 160 encounters
>           "p": 0.8,      // relative probability 0.8 means 200 parent objects
>           "u": false,    // the values contain duplicates
>           "d": {...}     // placeholder, defined further below
>         },
>         {
>           "t": 3,        // "nested document" type
>           ...
>         }
>       ]
>     }


### 4. Type-Specific Data

Inside a tag, each element is specified uniquely by its type, represented in the `t` member and its decimal value which corresponds with the BSON type. For each BSON type, this section defines a structure for the `d` member, which carries additional information specific for the type.


##### Type 1: Float

The `d` object contains the following members:

- `min`: The smallest value encountered in any sample document
- `max`: The largest value encountered in any sample document
- `avg`: The mean of all sample document values
- `med`: The median of all sample document values
- `v`: An array of all values encountered, in order of traversal


> #### Example

>     "d" : {
>       "min": 0.0
>       "max": 32.8,
>       "avg": 9.3499999,
>       "med": 5.25,
>       "v": [ 0.0, 1.4, 6.4, 3.2, 8.6, 18.3, 32.8, 4.1 ]
>     }


##### Type 2: string


The `d` object contains the following members:

- `min`: The smallest value encountered in any sample document
- `max`: The largest value encountered in any sample document
- `v`: Unique set of all values encountered, ordered by counts descending
- `c`: count for each value, same order as above


> #### Example

>     "d" : {
>       "min": "atlas",
>       "max": "zoo",
>       "v": [ "atlas", "song", "bird", "zoo", "breakfast" ],
>       "c": [ 15, 9, 7, 5, 2 ]
>     }
