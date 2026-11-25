// PATHWAY SHIM (not from upstream): the playground worker imports the wasm via Vite's
// `?url`, which Next cannot resolve. Pathway always passes its own worker
// (lib/practice/sql-worker.ts); this file only satisfies the static reference in index.ts.
// Removed once the upstream wasmUrl change lands (task 13).
import '../../../../../lib/practice/sql-worker';
