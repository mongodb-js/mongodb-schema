#!/usr/bin/env npx ts-node

import { MongoClient, Document } from 'mongodb';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import type { Schema, Relationship } from '../src';
import { SchemaAnalyzer, findRelationshipsForSchema } from '../src';

async function analyzeCollection(documents: AsyncIterable<Document>) {
  const analyzer = new SchemaAnalyzer({
    storeValues: true
  });
  for await (const doc of documents) {
    analyzer.analyzeDoc(doc);
  }
  return analyzer;
}

let client: MongoClient;
async function run() {
  const argv = await yargs(hideBin(process.argv))
    .option('sampleSize', { type: 'number', default: 1000 })
    .argv;

  const [uri, databaseName] = argv._ as [string, string];
  if (!(uri && databaseName)) {
    throw new Error('USAGE: analyze-database.ts connectionURI databaseName');
  }

  client = new MongoClient(uri);
  await client.connect();

  const db = client.db(databaseName);

  const collectionInfos = await db.listCollections().toArray();
  console.dir(collectionInfos);

  const collections: Record<string, Schema> = {};

  const relationships: Relationship[] = [];

  const collectionNames = collectionInfos.map((c) => c.name);

  for (const coll of collectionInfos) {
    console.log(coll.name);
    const collection = db.collection(coll.name);
    const cursor = collection.aggregate([{
      $sample: {
        size: argv.sampleSize
      }
    }], {
      allowDiskUse: true
    });

    const analyzer = await analyzeCollection(cursor);

    const schema = analyzer.getResult();
    collections[coll.name] = schema;

    relationships.push(...await findRelationshipsForSchema(db, coll.name, collectionNames, schema));

    console.log(); // newline
  }

  console.dir(relationships, { depth: null });
}

if (require.main === module) {
  run()
    .finally(() => {
      client?.close();
    })
    .catch((err) => {
      console.error(err.stack);
      process.exit(1);
    });
}
