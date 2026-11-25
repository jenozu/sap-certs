import { useEffect, useRef, useState } from 'react';

export type OutputEntry =
  | { type: 'stdout' | 'stderr' | 'warning'; text: string }
  | { type: 'error'; message: string; raw?: string }
  | { type: 'table'; columns: string[]; rows: unknown[][] }
  | { type: 'test'; name: string; passed: boolean; expected?: string; actual?: string };

export type OutputStatus = 'idle' | 'running' | 'success' | 'failed';

interface Props {
  entries: OutputEntry[];
  status?: OutputStatus;
  durationMs?: number;
  onClear?: () => void;
}

export function Entry({ e }: { e: OutputEntry }) {
  switch (e.type) {
    case 'stdout':
      return <pre data-testid="entry-stdout" className="whitespace-pre-wrap">{e.text}</pre>;
    case 'stderr':
    case 'warning':
      return (
        <pre data-testid={`entry-${e.type}`} className="whitespace-pre-wrap text-yellow-300">
          {e.text}
        </pre>
      );
    case 'error':
      return (
        <div data-testid="entry-error" className="text-red-400">
          <pre className="whitespace-pre-wrap">{e.message}</pre>
          {e.raw && (
            <details>
              <summary className="cursor-pointer">Raw details</summary>
              <pre className="whitespace-pre-wrap">{e.raw}</pre>
            </details>
          )}
        </div>
      );
    case 'table':
      return (
        <table data-testid="entry-table" className="border-collapse text-left">
          <thead>
            <tr>
              {e.columns.map((c, i) => (
                <th key={i} className="border border-slate-600 px-2">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {e.rows.map((r, i) => (
              <tr key={i}>
                {r.map((v, j) => (
                  <td key={j} className="border border-slate-700 px-2">{v === null ? 'NULL' : String(v)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'test':
      return (
        <div data-testid="entry-test" className={e.passed ? 'text-green-400' : 'text-red-400'}>
          {e.passed ? 'PASS' : 'FAIL'} {e.name}
          {!e.passed && (
            <div>
              <div>Expected: {e.expected}</div>
              <div>Actual: {e.actual}</div>
            </div>
          )}
        </div>
      );
  }
}

export function OutputPanel({ entries, status = 'idle', durationMs, onClear }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (pinned && el) el.scrollTop = el.scrollHeight;
  }, [entries, pinned]);

  return (
    <section aria-label="Output" className="flex h-full flex-col bg-slate-950 font-mono text-sm text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-700 px-2 py-1">
        <span data-testid="status">
          {status}
          {durationMs !== undefined && status !== 'running' && ` · ${durationMs} ms`}
        </span>
        <button type="button" onClick={onClear} className="underline">Clear</button>
      </div>
      <div
        ref={ref}
        onScroll={(ev) => {
          const el = ev.currentTarget;
          setPinned(el.scrollHeight - el.scrollTop - el.clientHeight < 8);
        }}
        className="flex-1 space-y-1 overflow-auto p-2"
      >
        {entries.map((e, i) => <Entry key={i} e={e} />)}
      </div>
    </section>
  );
}
