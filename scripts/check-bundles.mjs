import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { gzipSync } from 'node:zlib';
import { build } from 'vite';

async function compile(simulateAppUpdate = false) {
  const result = await build({
    logLevel: 'silent',
    build: { write: false },
    plugins: simulateAppUpdate ? [{
      name: 'simulate-app-update',
      enforce: 'pre',
      transform(code, id) {
        if (id.replaceAll('\\', '/').endsWith('/src/App.jsx')) {
          return { code: `${code}\nconsole.info('Bundle cache verification');`, map: null };
        }
      },
    }] : [],
  });
  return result.output.filter(item => item.type === 'chunk');
}

const original = await compile();
const updated = await compile(true);
const entry = original.find(chunk => chunk.isEntry);
const vendor = original.find(chunk => chunk.name === 'vendor');
const nextVendor = updated.find(chunk => chunk.name === 'vendor');
const app = original.find(chunk => chunk.name === 'mount');
const nextApp = updated.find(chunk => chunk.name === 'mount');

assert.deepEqual(entry.imports, [], 'Startup must not eagerly import dependencies');
assert.ok(Buffer.byteLength(entry.code) < 4096, 'Keep the startup script under 4 KB');
assert.ok(entry.dynamicImports.includes(app.fileName), 'Application must stay deferred');
assert.ok(app.imports.includes(vendor.fileName), 'Application should share the vendor chunk');
assert.deepEqual(vendor.imports, [], 'Vendor must not depend on application code');
assert.equal(vendor.fileName, nextVendor.fileName, 'App updates must preserve the vendor URL');
assert.equal(vendor.code, nextVendor.code, 'App updates must preserve vendor contents');
assert.notEqual(app.fileName, nextApp.fileName, 'Changed application code must get a new URL');

for (const chunk of original) {
  console.log(`${chunk.fileName}: ${Buffer.byteLength(chunk.code)} bytes (${gzipSync(chunk.code).length} gzip)`);
}
console.log('PASS: deferred startup and vendor cache stability after an application update');
