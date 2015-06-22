```
[<hidden>FieldCollection]
[Schema|ns: String The collection's namespace|parse(doc) Figure out the the fields for this sampled doc|fields: FieldCollection] -->  [mongodb-schema#field]

[<package> mongodb-schema#field|
  [<abstract>Field|
      _id: String;
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
  [EmbeddedArrayField|lengths: int;average_length: int]-:> [Field]

  [<package>Field#values|
    [ValueCollection]+-> 1..*[Value|_id: String|value: *]
  ]
  [Field#values] o-> [Field#types]
  [<package>Field#types|
    [Type|_id: String;count: Number;probability: Number;unique: Number|values: ValueCollection]
    [TypeCollection]
    [TypeCollection]+-> 1..*[Type]
  ]
]
```
