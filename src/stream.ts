import { Duplex } from 'stream';

import type {
  Document
} from 'bson';

import { SchemaAnalyzer } from './schema-analyzer';
import type { SchemaParseOptions } from './schema-analyzer';

type ParseStreamOptions = SchemaParseOptions & {
  simplifiedSchema?: boolean,
  schemaPaths?: boolean;
};

export class ParseStream extends Duplex {
  analyzer: SchemaAnalyzer;
  options: ParseStreamOptions;
  schemaPaths = false;

  constructor(options?: ParseStreamOptions) {
    super({ objectMode: true });
    this.options = options || {};
    this.analyzer = new SchemaAnalyzer(options);
  }

  _write(obj: Document, enc: unknown, cb: () => void) {
    this.analyzer.analyzeDoc(obj);
    this.emit('progress', obj);
    cb();
  }

  _read() {}

  _final(cb: () => void) {
    if (this.options.schemaPaths) {
      this.push(this.analyzer.getSchemaPaths());
    } else if (this.options.simplifiedSchema) {
      this.push(this.analyzer.getSimplifiedSchema());
    } else {
      this.push(this.analyzer.getResult());
    }
    this.push(null);
    cb();
  }
}

export default function makeParseStream(options?: ParseStreamOptions) {
  return new ParseStream(options);
}
