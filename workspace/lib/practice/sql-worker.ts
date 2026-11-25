/// <reference lib="webworker" />
// Pathway's sql.js worker: same message handler as the playground (vendored core),
// but the wasm is served from /sqljs/ instead of a Vite `?url` import.
import initSqlJs from 'sql.js';
import { createHandler, type SqlMsg } from '../../vendor/playground/execution/adapters/sql/core';

const ready = initSqlJs({ locateFile: () => '/sqljs/sql-wasm.wasm' }).then(createHandler);

self.onmessage = async ({ data }: MessageEvent<SqlMsg & { id: number }>) => {
  try {
    const handle = await ready;
    self.postMessage({ id: data.id, result: handle(data) });
  } catch (e) {
    self.postMessage({ id: data.id, error: e instanceof Error ? e.message : String(e) });
  }
};
