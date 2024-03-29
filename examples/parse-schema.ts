/* eslint no-console: 0 */

import { MongoClient } from 'mongodb';

import parseSchema from '../src';

const dbName = 'test';

const client = new MongoClient(`mongodb://localhost:27017/${dbName}`);

async function run() {
  const db = client.db(dbName);

  try {
    const docs = await db.collection('test-schema').find().limit(100);

    const parsedSchema = await parseSchema(docs, {});

    console.log(JSON.stringify(parsedSchema, null, 2));
  } catch (err) {
    return console.error(err);
  } finally {
    await client.close();
  }
}

run();
