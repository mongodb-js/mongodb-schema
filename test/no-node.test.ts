import assert from 'assert';
import vm from 'vm';
import fs from 'fs';
import path from 'path';

function createMockModuleSystem() {
  const context = vm.createContext(Object.create(null));
  class Module {
    exports = {};
  }
  const modules = new Map<string, Module>();
  // Tiny (incomplete) CommonJS module system mock
  function makeRequire(basename: string) {
    return function require(identifier: string): any {
      if (!identifier.startsWith('./') && !identifier.startsWith('../') && !identifier.startsWith('/')) {
        let current = path.dirname(basename);
        let previous: string;
        do {
          const nodeModulesEntry = path.resolve(current, 'node_modules', identifier);
          previous = current;
          current = path.dirname(current);
          if (fs.existsSync(nodeModulesEntry)) {
            console.log({ previous, current, nodeModulesEntry, identifier });
            return require(nodeModulesEntry);
          }
        } while (previous !== current);
        throw new Error(`mock require() does not support Node.js built-ins (${identifier})`);
      }
      let file = path.resolve(path.dirname(basename), identifier);
      if (!fs.existsSync(file) && fs.existsSync(`${file}.js`)) {
        file = `${file}.js`;
      } else if (fs.statSync(file).isDirectory()) {
        if (fs.existsSync(`${file}/package.json`)) {
          const pjson = JSON.parse(fs.readFileSync(`${file}/package.json`, 'utf8'));
          file = path.resolve(file, pjson.main || 'index.js');
        } else if (fs.existsSync(`${file}/index.js`)) {
          file = path.resolve(file, 'index.js');
        }
      }
      const existing = modules.get(file);
      if (existing) {
        return existing.exports;
      }
      const module = new Module();
      const source = fs.readFileSync(file);
      vm.runInContext(`(function(require, module, exports, __filename, __dirname) {\n${source}\n})`, context)(
        makeRequire(file), module, module.exports, file, path.dirname(file)
      );
      modules.set(file, module);
      return module.exports;
    };
  }
  return makeRequire;
}

describe('getSchema should work in plain JS environment without Node.js or browser dependencies', function() {
  const docs = [
    { foo: 'bar' },
    { country: 'Croatia' },
    { country: 'Croatia' },
    { country: 'England' }
  ];

  it('Check if return value is a promise', async function() {
    const makeRequire = createMockModuleSystem();

    const { parseSchema } = makeRequire(__filename)('../lib/index.js') as typeof import('..');

    const result = await parseSchema(docs);
    assert.strictEqual(result.count, 4);
    assert.strictEqual(result.fields.map(f => f.name).join(','), 'country,foo');
  });
});
