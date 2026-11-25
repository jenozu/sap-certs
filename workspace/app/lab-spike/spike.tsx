'use client';
// Task 4 compatibility spike (temporary; removed in task 13).
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { OutputPanel, type OutputEntry, type OutputStatus } from '../../vendor/playground/components/terminal/OutputPanel';
import { runSql } from '../../lib/practice/engine';
import { z } from 'zod/v4';

const CodeEditor = dynamic(() => import('../../vendor/playground/components/editor/CodeEditor').then(m => m.CodeEditor), { ssr: false });
const DATASET = `CREATE TABLE warehouses(id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE products(id INTEGER PRIMARY KEY, sku TEXT);
INSERT INTO warehouses VALUES (1,'Montreal'),(2,'Toronto');
INSERT INTO products VALUES (1,'PUMP-100'),(2,'SEAL-200'),(3,'BOLT-300');`;
const zodCheck = z.object({ ok: z.literal(true) }).safeParse({ ok: true }).success;

export default function Spike() {
  const [code, setCode] = useState('SELECT w.name, p.sku FROM warehouses w CROSS JOIN products p ORDER BY 1, 2;');
  const [entries, setEntries] = useState<OutputEntry[]>([]);
  const [status, setStatus] = useState<OutputStatus>('idle');
  const [ms, setMs] = useState<number>();
  async function run(src = code) {
    setStatus('running'); const t = performance.now();
    const r = await runSql(src, DATASET);
    setMs(Math.round(performance.now() - t));
    setEntries(r.success ? (r.tables ?? []).map(tb => ({ type: 'table' as const, columns: tb.columns, rows: tb.rows })).concat(r.tables?.length ? [] : [{ type: 'stdout', text: r.output } as never]) : r.errors.map(m => ({ type: 'error' as const, message: m })));
    setStatus(r.success ? 'success' : 'failed');
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-3 p-4">
      <h1 className="text-lg font-semibold">Practice engine spike</h1>
      <p className="text-sm" data-testid="zod">zod/v4: {zodCheck ? 'ok' : 'failed'} · dialect: SQLite</p>
      <div className="min-h-48 rounded border" data-testid="editor"><CodeEditor value={code} onChange={setCode} language="sql" onRun={() => run()} /></div>
      <div className="flex flex-wrap gap-2">
        <button className="rounded bg-black px-3 py-1 text-white" onClick={() => run()}>Run</button>
        <button className="rounded border px-3 py-1" onClick={() => run('WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n) SELECT count(*) FROM n;')}>Run runaway query</button>
      </div>
      <div className="h-64"><OutputPanel entries={entries} status={status} durationMs={ms} onClear={() => setEntries([])} /></div>
    </main>
  );
}
