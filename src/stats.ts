import type { Schema, ArraySchemaType, SchemaField, SchemaType } from './schema-analyzer';

function widthRecursive(schema?: Schema) {
  let width = 0;
  if (!schema) {
    return width;
  }
  if (schema.fields === undefined) {
    return width;
  }

  width += schema.fields.length;

  width += schema.fields.map((field) => {
    const doc = field.types.find(v => v.name === 'Document');
    return widthRecursive(doc as any);
  }).reduce((p, c) => p + c || 0, 0);

  width += schema.fields.map((field: SchemaField) => {
    const arr = field.types.find((v: SchemaType) => v.name === 'Array');
    if (arr) {
      const doc = (arr as ArraySchemaType).types.find(v => v.name === 'Document');
      return widthRecursive(doc as Schema | undefined);
    }
  })
    .reduce((p, c) => ((p ?? 0) + (c ?? 0)) || 0, 0) ?? 0;
  return width;
}

function depthRecursive(schema?: Schema) {
  if (!schema) {
    return 0;
  }
  let maxChildDepth = 0;
  if (schema.fields !== undefined && schema.fields.length > 0) {
    maxChildDepth = 1 + Math.max(
      Math.max(...schema.fields.map(field => {
        const doc = field.types.find(v => v.name === 'Document');
        return depthRecursive(doc as Schema | undefined);
      })),
      Math.max(...schema.fields.map(field => {
        const arr = field.types.find(v => v.name === 'Array');
        if (arr) {
          const doc = (arr as ArraySchemaType).types.find(v => v.name === 'Document');
          return depthRecursive(doc as Schema | undefined);
        }
        return 0;
      }))
    );
  }
  return maxChildDepth;
}

function branchingFactors(schema?: Schema) {
  const branchArray: any[] = [];
  let res;
  if (!schema) {
    return branchArray;
  }
  if (schema.fields !== undefined && schema.fields.length > 0) {
    branchArray.push(schema.fields.length);
    res = schema.fields.map(function(field) {
      const doc = field.types.find(v => v.name === 'Document');
      return branchingFactors(doc as Schema | undefined);
    });
    branchArray.push(...res.flat(Infinity));
    res = schema.fields.map(function(field) {
      const arr = field.types.find(v => v.name === 'Array');
      if (arr) {
        const doc = (arr as ArraySchemaType).types.find(v => v.name === 'Document');
        return branchingFactors(doc as Schema | undefined);
      }
      return [];
    });
    branchArray.push(...res.flat(Infinity));
  }
  return branchArray.sort().reverse();
}

export default {
  width: widthRecursive,
  depth: depthRecursive,
  branch: branchingFactors
};
