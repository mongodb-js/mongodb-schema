/* eslint no-console: 0 */

import { MongoClient } from 'mongodb';

import parseSchema from '../src';

const dbName = 'test';
const collectionName = 'test-schema';
// const collectionName = 'complex';
// const collectionName = 'listings';
// const collectionName = 'all-bson-types';

const namespace = `${dbName}.${collectionName}`;

const client = new MongoClient(`mongodb://localhost:27017/${dbName}`);

async function run() {
  const db = client.db(dbName);

  try {
    const docsLimit = 10000;
    const docs = await db.collection(collectionName).find().limit(docsLimit).toArray();

    console.log(`Analyzing the schema of ${docs.length} documents from the '${namespace}' namespace...`);

    const startTime = Date.now();

    await parseSchema(docs, {});

    const elapsed = Date.now() - startTime;
    console.log(`Done. Time elapsed: ${elapsed} ms.`);
  } catch (err) {
    return console.error(err);
  } finally {
    await client.close();
  }
}

run();
