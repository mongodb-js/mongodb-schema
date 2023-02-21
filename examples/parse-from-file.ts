/* eslint no-console: 0 */

import { pipeline as callbackPipeline, PassThrough, Transform } from 'stream';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

import stream from '../src/stream';

const schemaFileName = path.join(__dirname, './fanclub.json');

function createFileStreamLineParser() {
  let currentLine: undefined | string;

  return new Transform({
    readableObjectMode: true,
    transform(chunk, encoding, next) {
      const lines = ((currentLine !== undefined ? currentLine : '') + chunk.toString()).split(/\r?\n/);

      currentLine = lines.pop();

      for (const line of lines) {
        this.push(JSON.parse(line));
      }

      next();
    },

    flush(done) {
      if (currentLine) {
        this.push(JSON.parse(currentLine));
      }

      done();
    }
  });
}

async function parseFromFile(fileName: string) {
  const startTime = Date.now();

  const fileReadStream = fs.createReadStream(fileName, {
    flags: 'r' // Open for reading, error if doesn't exist.
  });

  const dest = new PassThrough({ objectMode: true });
  const pipeline = promisify(callbackPipeline);
  await pipeline(fileReadStream, createFileStreamLineParser(), stream(), dest);
  let res;
  for await (const result of dest) {
    res = result;
  }

  const dur = Date.now() - startTime;
  console.log(res);
  console.log('Schema analysis took ' + dur + 'ms.'); // Log time it took to parse.
}

parseFromFile(schemaFileName);
