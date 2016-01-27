# Schema Statistics
## Schema Depth
The schema depth is defined as the maximum number of nested levels of keys in the schema. It does not matter if the subdocuments are nested directly or as elements of an array. An empty document has a depth of 0, whereas a document with some top-level keys but no nested subdocuments has a depth of 1.

## Schema Width
The schema width is defined as the number of individual keys, added up over all nesting levels of the schema. Array values do not count towards the schema width.

## Examples

Statistic    | Value
:----------- | :---:
Schema Depth | 0
Schema Width | 0

```js
{}
```

Statistic    | Value
:----------- | :---:
Schema Depth | 1
Schema Width | 1

```js
{
  one: 1
}
```

Statistic    | Value
:----------- | :---:
Schema Depth | 3
Schema Width | 4

```js
{
  one: [
    "foo",
    "bar",
    {
      two: {
        three: 3
      }
    },
    "baz"
  ],
  foo: "bar"
}
```

Statistic    | Value
:----------- | :---:
Schema Depth | 4
Schema Width | 10

```js
{
  a: 1,
  b: false,
  one: {
    c: null,
    two: {
      three: {
        four: 4,
        e: "deepest nesting level"
      }
    }
  },
  f: {
    g: "not the deepest level"
  }
}
```

Statistic    | Value
:----------- | :---:
Schema Depth | 2
Schema Width | 2

```js
// first document
{
  foo: [
    {
      bar: [1, 2, 3]
    }
  ]
},
// second document
{
  foo: 0
}
```
