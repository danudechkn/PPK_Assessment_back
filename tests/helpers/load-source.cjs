const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Load real services/controllers with an isolated database double; no DB connection or env files.
module.exports = function loadSource(entry, db) {
  const cache = new Map();
  function load(filename) {
    filename = path.resolve(filename);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
      fileName: filename,
    }).outputText;
    const localRequire = (id) => {
      if (id === '../models/product') return db;
      if (!id.startsWith('.')) return require(id);
      return load(path.resolve(path.dirname(filename), `${id}.ts`));
    };
    new Function('require', 'module', 'exports', source)(localRequire, module, module.exports);
    return module.exports;
  }
  return load(path.resolve(__dirname, '../..', entry)).default;
};
