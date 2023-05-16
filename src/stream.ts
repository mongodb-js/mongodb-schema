import { Duplex } from 'stream';

import type {
  Document
} from 'bson';

import { SchemaAnalyzer } from './schema-analyzer';
import type { SchemaParseOptions } from './schema-analyzer';

export class ParseStream extends Duplex {
  analyzer: SchemaAnalyzer;
  schemaPaths = false;
  constructor(options?: SchemaParseOptions & {
    schemaPaths?: boolean;
  }) {
    super({ objectMode: true });
    this.schemaPaths = !!options?.schemaPaths;
    this.analyzer = new SchemaAnalyzer(options);
  }

  _write(obj: Document, enc: unknown, cb: () => void) {
    this.analyzer.analyzeDoc(obj);
    this.emit('progress', obj);
    cb();
  }

  _read() {}

  _final(cb: () => void) {
    if (this.schemaPaths) {
      this.push(this.analyzer.getSchemaPaths());
    } else {
      this.push(this.analyzer.getResult());
    }
    this.push(null);
    cb();
  }
}

export default function makeParseStream(options?: SchemaParseOptions & {
    schemaPaths?: boolean;
  }) {
  return new ParseStream(options);
}
