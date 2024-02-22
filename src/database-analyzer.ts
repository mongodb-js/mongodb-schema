
import type { Schema } from './schema-analyzer';
import type { Db } from 'mongodb';

type CollectionFieldReference = {
  collection: string;
  fieldPath: string[];
}

type FieldReferenceWithValues = CollectionFieldReference & {
  values: any[]
}

export type Relationship = {
  from: CollectionFieldReference;
  to: CollectionFieldReference;
}

function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function findCandidateReferencesForSchema(collectionName: string, schema: Schema) {
  const candidatePaths: FieldReferenceWithValues[] = [];

  for (const field of schema.fields) {
    if (field.name === '_id') {
      continue;
    }

    // TODO: also consider anything matching a known naming convention like /_id$/
    // TODO: we might also want to consider any large integers if there are lots of different values?

    const values: any[] = [];
    for (const typeInfo of field.types) {
      if (['ObjectId', 'UUID'].includes(typeInfo.bsonType)) {
        values.push(...(typeInfo as { values: any[]}).values ?? []);
      }
    }
    if (values.length) {
      // in case the sample came from limit()* and wasn't already sorted randomly
      shuffleArray(values);

      candidatePaths.push({
        collection: collectionName,
        fieldPath: field.path,
        values
      });
      console.log(field.path);
    }
  }

  return candidatePaths;
}

async function findRelationshipsCandidate(db: Db, collectionNames: string[], candidatePaths: FieldReferenceWithValues[]) {
  const relationships: Relationship[] = [];

  // not the most efficient..
  for (const { collection, fieldPath, values } of candidatePaths) {
    for (const target of collectionNames) {
      const ids = values.slice(0, 10);
      const result = (await db.collection(target).aggregate([
        { $match: { _id: { $in: ids } } },
        { $count: 'matches' }
      ]).toArray());

      if (result.length) {
        console.log(collection, fieldPath, result);
        relationships.push({
          from: {
            collection,
            fieldPath
          },
          to: {
            collection: target,
            fieldPath: ['_id']
          }
        });
        // no point checking the collections - we assume this is a many to one
        break;
      }
    }
  }

  return relationships;
}

export async function findRelationshipsForSchema(db: Db, collectionName: string, collectionNames: string[], schema: Schema) {
  const candidatePaths = findCandidateReferencesForSchema(collectionName, schema);
  return await findRelationshipsCandidate(db, collectionNames, candidatePaths);
}
