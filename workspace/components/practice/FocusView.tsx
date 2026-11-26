'use client';
// One exercise in focus (task 19). Language-neutral: everything language-specific comes
// from the adapter (editor language, run, reset, evaluate, dialect note).
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, Lightbulb, Play, RotateCcw, Send, Undo2, X } from 'lucide-react';
import { OutputPanel, type OutputEntry, type OutputStatus } from '@/vendor/playground/components/terminal/OutputPanel';
import { LessonMarkdown } from '@/vendor/playground/features/lesson-viewer/LessonMarkdown';
import type { Evaluation, LanguageAdapter, PracticeExercise } from '@/lib/practice/adapters/types';
import { loadAdapter, NOT_SUPPORTED } from '@/lib/practice/adapters/registry';
import { contentHashOf } from '@/lib/practice/client/packs';
import { flushOutbox, getDraft, recordAttempt, saveDraft } from '@/lib/practice/client/api';
import { SchemaPanel } from './SchemaPanel';

const CodeEditor = dynamic(() => import('@/vendor/playground/components/editor/CodeEditor').then(m => m.CodeEditor), { ssr: false, loading: () => <div className="practice-editor-loading">Loading editor…</div> });

export interface SessionInfo { id: string; ids: string[]; index: number; hints: boolean; mode: string }
type Tab = 'task' | 'code' | 'output';

export function FocusView({ exercise, packId, session }: { exercise: PracticeExercise; packId: string; session?: SessionInfo }) {
  const [adapter, setAdapter] = useState<LanguageAdapter | null | undefined>(undefined);
  const [code, setCode] = useState(exercise.starter);
  const [rev, setRev] = useState(0);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'queued' | 'conflict' | 'error'>('idle');
  const [conflict, setConflict] = useState<string | null>(null);
  const [entries, setEntries] = useState<OutputEntry[]>([]);
  const [status, setStatus] = useState<OutputStatus>('idle');
  const [ms, setMs] = useState<number>();
  const [hints, setHints] = useState(0);
  const [solutionViewed, setSolutionViewed] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [result, setResult] = useState<Evaluation | null>(null);
  const [attemptNote, setAttemptNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>('task');
  const started = useRef(new Date());
  const loaded = useRef(false);
  const hintsAllowed = session ? session.hints : true;
  const fixtures = (exercise.context as { fixtures?: Record<string, string>; defaultFixture?: string }) ?? {};
  const schemaSql = fixtures.fixtures?.[fixtures.defaultFixture ?? ''] ?? '';

  useEffect(() => { loadAdapter(exercise.language).then(setAdapter).catch(() => setAdapter(null)); }, [exercise.language]);
  useEffect(() => {
    let live = true;
    flushOutbox().catch(() => undefined);
    getDraft(exercise.id).then(d => { if (live && d) { setCode(d.code); setRev(d.rev); } loaded.current = true; });
    const online = () => flushOutbox().then(n => n && setAttemptNote(`${n} saved item(s) synced.`));
    window.addEventListener('online', online);
    return () => { live = false; window.removeEventListener('online', online); };
  }, [exercise.id]);

  // Debounced draft autosave (separate from the sandbox).
  useEffect(() => {
    if (!loaded.current) return;
    setSaveState('saving');
    const t = setTimeout(async () => {
      try {
        const r = await saveDraft(exercise.id, exercise.language, code, rev);
        if ('rev' in r) { setRev(r.rev); setSaveState('saved'); }
        else if ('queued' in r) setSaveState('queued');
        else { setConflict(r.conflict.code); setSaveState('conflict'); }
      } catch { setSaveState('error'); }
    }, 900);
    return () => clearTimeout(t);
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  const show = (r: { success: boolean; output: string; errors: string[]; tables?: { columns: string[]; rows: unknown[][] }[] }): OutputEntry[] => r.success
    ? [...(r.tables ?? []).map(t => ({ type: 'table' as const, columns: t.columns, rows: t.rows })), ...(r.output ? [{ type: 'stdout' as const, text: r.output }] : []), ...(!r.tables?.length && !r.output ? [{ type: 'stdout' as const, text: 'Statement ran. No rows returned.' }] : [])]
    : r.errors.map(m => ({ type: 'error' as const, message: m }));

  const run = useCallback(async () => {
    if (!adapter || busy) return;
    setBusy(true); setStatus('running'); setTab('output');
    const t = performance.now();
    const r = await adapter.run(code, exercise);
    setMs(Math.round(performance.now() - t)); setEntries(show(r)); setStatus(r.success ? 'success' : 'failed'); setBusy(false);
  }, [adapter, busy, code, exercise]);

  async function submit() {
    if (!adapter || busy) return;
    setBusy(true); setStatus('running'); setTab('output'); setAttemptNote('');
    const t = performance.now();
    const ev = await adapter.evaluate(code, exercise);
    setMs(Math.round(performance.now() - t));
    setResult(ev);
    setEntries(ev.error ? [{ type: 'error', message: ev.error }] : ev.checks.map(c => ({ type: 'test' as const, name: c.name, passed: c.passed, actual: c.detail })));
    setStatus(ev.passed ? 'success' : 'failed');
    if (!ev.error) {
      try {
        const saved = await recordAttempt({
          id: crypto.randomUUID(), language: exercise.language, exerciseId: exercise.id, exerciseVersion: exercise.version, contentHash: contentHashOf(exercise),
          packId, skills: exercise.skills, mode: (session?.mode ?? 'targeted') as never, code, passed: ev.passed, correct: ev.correct, constructOk: ev.constructOk,
          results: ev.checks.map(c => ({ name: c.name.slice(0, 200), passed: c.passed, detail: c.detail?.slice(0, 2000) })), hintsUsed: hints, solutionViewed,
          practiceSessionId: session?.id ?? null, durationMs: Math.min(Date.now() - started.current.getTime(), 24 * 3600_000),
          startedAt: started.current.toISOString(), submittedAt: new Date().toISOString(),
        });
        setAttemptNote(saved === 'saved' ? 'Attempt saved.' : 'Offline: attempt saved on this device and will sync automatically.');
      } catch (e) { setAttemptNote((e as Error).message); }
    }
    setBusy(false);
  }

  async function keepMine() {
    const d = await getDraft(exercise.id);
    const r = await saveDraft(exercise.id, exercise.language, code, d?.rev ?? 0).catch(() => null);
    if (r && 'rev' in r) { setRev(r.rev); setConflict(null); setSaveState('saved'); }
  }
  async function resetSandbox() { if (adapter) { setTab('output'); await adapter.resetSandbox(exercise); setEntries([{ type: 'stdout', text: 'Sandbox reset: the database is back to its original data. Your code was not changed.' }]); setStatus('idle'); } }
  function restoreStarter() { if (window.confirm('Replace your code with the original starter code?')) setCode(exercise.starter); }
  function viewSolution() { if (solutionViewed || window.confirm('Viewing the solution marks this attempt as assisted (it won\'t count as independent practice). Show it?')) { setSolutionViewed(true); setShowSolution(true); } }

  if (adapter === null) return <div className="error" role="alert">{NOT_SUPPORTED(exercise.language)}</div>;
  const next = session && session.index + 1 < session.ids.length ? session.ids[session.index + 1] : null;

  return (
    <div className="practice-focus">
      <div className="practice-head">
        <div>
          <div className="eyebrow">{adapter?.dialectNote ?? 'Loading…'} · {exercise.difficulty} · {exercise.kind.replace('-', ' ')}{session && ` · ${session.index + 1} of ${session.ids.length}`}</div>
          <h1>{exercise.title}</h1>
        </div>
        <div className="practice-save" aria-live="polite">{{ idle: '', saving: 'Saving…', saved: 'Code saved', queued: 'Saved offline', conflict: 'Changed on another device', error: 'Not saved' }[saveState]}</div>
      </div>
      {conflict !== null && (
        <div className="error" role="alert"><span>This code was changed on another device.</span>
          <button onClick={() => { setCode(conflict); setConflict(null); getDraft(exercise.id).then(d => d && setRev(d.rev)); }}>Use the other version</button>
          <button onClick={keepMine}>Keep mine</button>
        </div>
      )}
      <div className="practice-tabs mobile-only" role="tablist">
        {(['task', 'code', 'output'] as Tab[]).map(t => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'selected' : ''} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}
      </div>
      <div className="practice-grid">
        <section className={`practice-task panel ${tab === 'task' ? 'show' : ''}`} aria-label="Instructions">
          <div className="padded">
            <LessonMarkdown markdown={exercise.instructions.replace(/^#\s+[^\n]*\n+/, '')} />
            {schemaSql && <SchemaPanel sql={schemaSql} />}
            <div className="practice-hints">
              {hintsAllowed ? <>
                {exercise.hints.slice(0, hints).map((h, i) => <p key={i} className="practice-hint"><Lightbulb size={15} /> {h}</p>)}
                {hints < exercise.hints.length && <button className="text-button" onClick={() => setHints(h => h + 1)}><Lightbulb size={14} />{hints ? 'Next hint' : 'Show a hint'} ({hints}/{exercise.hints.length})</button>}
              </> : <p className="muted">Hints are off for this session.</p>}
              {hintsAllowed && <button className="text-button" onClick={viewSolution}><Eye size={14} />View solution</button>}
              {showSolution && <pre className="practice-solution" aria-label="Solution">{exercise.solution}</pre>}
            </div>
          </div>
        </section>
        <section className={`practice-code panel ${tab === 'code' ? 'show' : ''}`} aria-label="Code editor">
          <div className="practice-editor"><CodeEditor value={code} onChange={setCode} language={adapter?.editorLanguage ?? 'sql'} onRun={run} /></div>
          <div className="practice-actions">
            <button className="primary" onClick={run} disabled={!adapter || busy}><Play size={15} />Run</button>
            <button className="primary" onClick={submit} disabled={!adapter || busy}><Send size={15} />Submit</button>
            <button className="secondary" onClick={resetSandbox} disabled={!adapter || busy} title="Restore the database; keeps your code"><RotateCcw size={15} />Reset sandbox</button>
            <button className="secondary" onClick={restoreStarter} disabled={busy}><Undo2 size={15} />Restore starter</button>
          </div>
        </section>
        <section className={`practice-output ${tab === 'output' ? 'show' : ''}`} aria-label="Results">
          {result && !result.error && <div className={`practice-verdict ${result.passed ? 'pass' : 'fail'}`} role="status">
            {result.passed ? <><Check size={16} />Correct{hints || solutionViewed ? ' (assisted)' : ''}</> : <><X size={16} />{result.correct && !result.constructOk ? 'Right result, but the required construct is missing' : 'Not yet'}</>}
          </div>}
          {attemptNote && <p className="muted" role="status">{attemptNote}</p>}
          <OutputPanel entries={entries} status={status} durationMs={ms} onClear={() => setEntries([])} />
          <div className="practice-nav">
            <Link className="text-button" href="/practice"><ArrowLeft size={14} />All practice</Link>
            {next && <Link className="primary" href={`/practice/${encodeURIComponent(next)}?session=${encodeURIComponent(session!.id)}`}>Next exercise<ArrowRight size={14} /></Link>}
          </div>
        </section>
      </div>
    </div>
  );
}
