// Copies the sql.js wasm into public/ so the worker can load it in every environment.
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const src = require.resolve('sql.js/dist/sql-wasm.wasm');
mkdirSync(new URL('../public/sqljs/', import.meta.url), { recursive: true });
copyFileSync(src, new URL('../public/sqljs/sql-wasm.wasm', import.meta.url));
console.log('copied sql-wasm.wasm');
