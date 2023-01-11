import es from 'event-stream';
import type { AggregationCursor, Document, FindCursor } from 'mongodb';
import type { Readable } from 'stream';

import stream from './stream';
import type { SchemaParseOptions, Schema } from './stream';
import * as schemaStats from './stats';

type MongoDBCursor = AggregationCursor | FindCursor;

/**
 * Convenience shortcut for parsing schemas. Accepts an array, stream or
 * MongoDB cursor object to parse documents` from.
 */
function parseSchema(
  docs: Document[] | MongoDBCursor | Readable,
  options?: SchemaParseOptions
): Promise<Schema> {
  const promise = new Promise<Schema>((resolve, reject) => {
    // shift parameters if no options are specified
    if (typeof options === 'undefined') {
      options = {};
    }

    let src: Readable | es.MapStream;
    // MongoDB Cursors
    if ('stream' in docs) {
      src = docs.stream();
      // Streams
    } else if ('pipe' in docs) {
      src = docs;
      // Arrays
    } else if (Array.isArray(docs)) {
      src = es.readArray(docs);
    } else {
      return reject(new Error(
        'Unknown input type for `docs`. Must be an array, ' +
          'stream or MongoDB Cursor.'
      ));
    }

    let result: Schema;

    src
      .pipe(stream(options))
      .on('data', function(data: Schema) {
        result = data;
      })
      .on('error', function(err: Error) {
        reject(err);
      })
      .on('end', function() {
        resolve(result);
      });
  });

  return promise;
}

export default parseSchema;

export {
  stream,
  schemaStats
};
