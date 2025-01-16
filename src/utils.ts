import { SchemaAnalyzer, SchemaParseOptions } from './schema-analyzer';
import { AnyIterable } from './types';

export function verifyStreamSource(
  source: AnyIterable
): AnyIterable {
  if (!(Symbol.iterator in source) && !(Symbol.asyncIterator in source)) {
    throw new Error(
      'Unknown input type for `docs`. Must be an array, ' +
        'stream or MongoDB Cursor.'
    );
  }

  return source;
}

export async function getCompletedSchemaAnalyzer(
  source: AnyIterable,
  options?: SchemaParseOptions
): Promise<SchemaAnalyzer> {
  const analyzer = new SchemaAnalyzer(options);
  for await (const doc of verifyStreamSource(source)) {
    if (options?.signal?.aborted) throw options.signal.aborted;
    analyzer.analyzeDoc(doc);
  }
  return analyzer;
}
