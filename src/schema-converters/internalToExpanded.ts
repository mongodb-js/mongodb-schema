import { ArraySchemaType, DocumentSchemaType, Schema as InternalSchema, SchemaType, SchemaField } from '../schema-analyzer';
import { type ExpandedJSONSchema } from '../types';
import { InternalTypeToStandardTypeMap, RELAXED_EJSON_DEFINITIONS } from './internalToStandard';
import { InternalTypeToBsonTypeMap } from './internalToMongoDB';
import { allowAbort } from './util';

export class InternalToExpandedConverter {
  private usedDefinitions = new Set<string>();

  private clearUsedDefintions() {
    this.usedDefinitions.clear();
  }

  private getUsedDefinitions() {
    const filteredDefinitions = Object.fromEntries(
      Object.entries(RELAXED_EJSON_DEFINITIONS)
        .filter(([key]) => this.usedDefinitions.has(key))
    );
    return Object.freeze(filteredDefinitions);
  }

  private markUsedDefinition(ref: string) {
    this.usedDefinitions.add(ref.split('/')[2]);
  }

  private getStandardType(internalType: string) {
    const type = { ...InternalTypeToStandardTypeMap[internalType] };
    if (!type) throw new Error(`Encountered unknown type: ${internalType}`);
    return type;
  }

  private getBsonType(internalType: string) {
    const type = InternalTypeToBsonTypeMap[internalType];
    if (!type) throw new Error(`Encountered unknown type: ${internalType}`);
    return type;
  }

  private async parseType(type: SchemaType, signal?: AbortSignal): Promise<ExpandedJSONSchema> {
    await allowAbort(signal);
    const schema: ExpandedJSONSchema = {
      ...this.getStandardType(type.bsonType),
      'x-bsonType': this.getBsonType(type.bsonType),
      'x-metadata': this.getMetadata(type)
    };
    if ('values' in type && !!type.values) {
      schema['x-sampleValues'] = type.values;
    }
    if (schema.$ref) this.markUsedDefinition(schema.$ref);
    switch (type.bsonType) {
      case 'Array':
        schema.items = await this.parseTypes((type as ArraySchemaType).types);
        break;
      case 'Document':
        Object.assign(schema,
          await this.parseFields((type as DocumentSchemaType).fields, signal)
        );
        break;
    }

    return schema;
  }

  private getMetadata<TType extends SchemaField | SchemaType>({
    hasDuplicates,
    probability,
    count
  }: TType) {
    return {
      ...(typeof hasDuplicates === 'boolean' ? { hasDuplicates } : {}),
      probability,
      count
    };
  }

  private async parseTypes(types: SchemaType[], signal?: AbortSignal): Promise<ExpandedJSONSchema> {
    await allowAbort(signal);
    const definedTypes = types.filter(type => type.bsonType.toLowerCase() !== 'undefined');
    const isSingleType = definedTypes.length === 1;
    if (isSingleType) {
      return this.parseType(definedTypes[0], signal);
    }
    const parsedTypes = await Promise.all(definedTypes.map(type => this.parseType(type, signal)));
    return {
      anyOf: parsedTypes
    };
  }

  private async parseFields(fields: DocumentSchemaType['fields'], signal?: AbortSignal): Promise<{
    required: ExpandedJSONSchema['required'],
    properties: ExpandedJSONSchema['properties'],
  }> {
    const required = [];
    const properties: ExpandedJSONSchema['properties'] = {};
    for (const field of fields) {
      if (field.probability === 1) required.push(field.name);
      properties[field.name] = {
        ...await this.parseTypes(field.types, signal),
        'x-metadata': this.getMetadata(field)
      };
    }

    return { required, properties };
  }

  public async convert(
    internalSchema: InternalSchema,
    options: {
      signal?: AbortSignal
  } = {}): Promise<ExpandedJSONSchema> {
    this.clearUsedDefintions();
    const { required, properties } = await this.parseFields(internalSchema.fields, options.signal);
    const schema: ExpandedJSONSchema = {
      type: 'object',
      'x-bsonType': 'object',
      required,
      properties,
      $defs: this.getUsedDefinitions()
    };
    return schema;
  }
}
