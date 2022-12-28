/* eslint no-console: 0 */

import stream from '../src/stream';
import es from 'event-stream';
import path from 'path';
import fs from 'fs';

const ts = new Date();

fs.createReadStream(path.join(__dirname, './fanclub.json'), {
  flags: 'r'
})
  .pipe(es.split()) // split file into individual json docs (one per line)
  .pipe(es.parse()) // parse each doc
  .pipe(stream()) // comment out this line to skip schema parsing
  .pipe(es.stringify()) // stringify result
  .pipe(es.wait(function(err, res) { // assemble everything back together
    if (err) {
      throw err;
    }
    const dur = new Date() - ts;
    console.log(res);
    console.log('took ' + dur + 'ms.'); // log time it took to parse
  }));
