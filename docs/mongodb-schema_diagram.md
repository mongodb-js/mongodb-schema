```
[<hidden>FieldCollection]
[Schema|ns: String The collection's namespace|parse(doc) Figure out the the fields for this sampled doc|fields: FieldCollection] -->  [mongodb-schema#field]

[<package> mongodb-schema#field|
  [<abstract>Field|
      name: String;
      count: Number;
      probability: Number;
      unique: Number;
      title: String;
      default: *;
      description: String
      |
      values: ValueCollection
      |
      types: TypeCollection
      |
      fields: FieldCollection
  ]
  [Field]-->[Field#values]
  [BasicField] -:> [Field]
  [EmbeddedDocumentField]-:> [Field]
  [EmbeddedArrayField|lengths: Array<int>;average_length: int]-:> [Field]

  [<package>Field#values|
    [ValueCollection]+-> 1..*[Value|id: String|value: *]
  ]
  [Field#values] o-> [Field#types]
  [<package>Field#types|
    [Type|name: String;count: Number;probability: Number;unique: Number|values: ValueCollection]
    [TypeCollection]
    [TypeCollection]+-> 1..*[Type]
  ]
]
```
