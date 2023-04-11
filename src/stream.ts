import { Duplex } from 'stream';

import type {
  Document
} from 'bson';

import { SchemaAnalyzer } from './schema-analyzer';
import type { SchemaParseOptions } from './schema-analyzer';

export class ParseStream extends Duplex {
  analyzer: SchemaAnalyzer;
  constructor(options?: SchemaParseOptions) {
    super({ objectMode: true });
    this.analyzer = new SchemaAnalyzer(options);
  }

  _write(obj: Document, enc: unknown, cb: () => void) {
    this.analyzer.analyzeDoc(obj);
    this.emit('progress', obj);
    cb();
  }

  _read() {}

  _final(cb: () => void) {
    this.push(this.analyzer.getResult());
    this.push(null);
    cb();
  }
}

// for backwards compatibility
export default function makeParseStream(options?: SchemaParseOptions) {
  return new ParseStream(options);
}
