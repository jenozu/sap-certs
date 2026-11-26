'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Check, Dumbbell, Play, Search } from 'lucide-react';
import { PracticeShell } from '@/components/practice/PracticeShell';
import { listPacks, type PackSummary } from '@/lib/practice/client/packs';
import { listAttempts, listSkills, startSession } from '@/lib/practice/client/api';
import { pickExercises, saveSession } from '@/lib/practice/client/session';
import { LANGUAGES } from '@/lib/practice/adapters/registry';

const DIFFS = ['intro', 'core', 'stretch'] as const;

export default function PracticeHome() {
  const router = useRouter();
  const [packs, setPacks] = useState<PackSummary[]>([]);
  const [error, setError] = useState('');
  const [passed, setPassed] = useState(new Set<string>());
  const [attempted, setAttempted] = useState(new Set<string>());
  const [names, setNames] = useState<Record<string, string>>({});
  const [lang, setLang] = useState('sql');
  const [sel, setSel] = useState<string[]>([]);
  const [diff, setDiff] = useState<string[]>([]);
  const [count, setCount] = useState(5);
  const [hints, setHints] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    listPacks().then(setPacks).catch(e => setError(e.message));
    listAttempts().then(a => { setAttempted(new Set(a.map(x => x.exerciseId))); setPassed(new Set(a.filter(x => x.passed).map(x => x.exerciseId))); }).catch(() => undefined);
    listSkills().then(s => setNames(Object.fromEntries(s.map(x => [x.id, x.name])))).catch(() => undefined);
    const p = new URLSearchParams(window.location.search).get('skills');
    if (p) setSel(p.split(',').filter(Boolean)); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const exercises = useMemo(() => packs.filter(p => p.language === lang).flatMap(p => p.exercises.map(e => ({ ...e, pack: p.id }))), [packs, lang]);
  const concepts = useMemo(() => [...new Set(exercises.flatMap(e => e.skills))].sort(), [exercises]);
  const label = (s: string) => names[s] ?? s.replace(/^[a-z]+-/, '').replace(/-/g, ' ').toUpperCase();
  const shown = exercises.filter(e => (!sel.length || e.skills.some(s => sel.includes(s))) && (!diff.length || diff.includes(e.difficulty)) && (!q || e.title.toLowerCase().includes(q.toLowerCase())));
  const toggle = (arr: string[], v: string, set: (x: string[]) => void) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  async function start() {
    const ids = pickExercises(exercises, { skills: sel, difficulty: diff, count }, passed, attempted);
    if (!ids.length) { setError('No exercises match. Try fewer filters, or add a pack for these concepts in the Skill library.'); return; }
    const id = crypto.randomUUID();
    const mode = sel.length > 1 ? 'mixed' : 'targeted';
    saveSession({ id, ids, index: 0, hints, mode });
    await startSession(id, lang, { skills: sel, difficulty: diff as never, count: ids.length, hints, mode });
    router.push(`/practice/${encodeURIComponent(ids[0])}?session=${id}`);
  }

  return (
    <PracticeShell active="Practice">
      <div className="page-heading"><div><div className="eyebrow">PRACTISE WHAT YOU JUST LEARNED</div><h1>Practice</h1><p>Pick concepts, set the size, and work through real business queries. Every Submit is saved.</p></div></div>
      {error && <div className="error" role="alert"><span>{error}</span></div>}
      <section className="panel practice-builder" aria-label="Build a practice session">
        <div className="padded">
          <div className="row between wrap">
            <label>Language{' '}<select value={lang} onChange={e => { setLang(e.target.value); setSel([]); }} aria-label="Language">
              {LANGUAGES.map(l => <option key={l.id} value={l.id} disabled={l.status !== 'available'}>{l.label}{l.status !== 'available' ? ' (coming later)' : ''}</option>)}
            </select></label>
            <Link className="text-button" href="/skills">Add a concept you learned</Link>
          </div>
          <fieldset><legend>Concepts (pick one or more)</legend>
            <div className="filters">{concepts.map(c => <button key={c} type="button" aria-pressed={sel.includes(c)} className={sel.includes(c) ? 'selected' : ''} onClick={() => toggle(sel, c, setSel)}>{label(c)}</button>)}</div>
          </fieldset>
          <fieldset><legend>Difficulty</legend>
            <div className="filters">{DIFFS.map(d => <button key={d} type="button" aria-pressed={diff.includes(d)} className={diff.includes(d) ? 'selected' : ''} onClick={() => toggle(diff, d, setDiff)}>{d}</button>)}</div>
          </fieldset>
          <div className="row wrap practice-builder-row">
            <label>Exercises <select value={count} onChange={e => setCount(Number(e.target.value))} aria-label="Number of exercises">{[3, 5, 10, 15, 20].map(n => <option key={n}>{n}</option>)}</select></label>
            <label className="row"><input type="checkbox" checked={hints} onChange={e => setHints(e.target.checked)} /> Allow hints</label>
            <button className="primary" onClick={start}><Play size={15} />Start session</button>
          </div>
        </div>
      </section>
      <div className="row between wrap practice-list-head">
        <h2>{shown.length} exercise{shown.length === 1 ? '' : 's'}</h2>
        <label className="search"><Search size={17} /><input placeholder="Search exercises…" aria-label="Search exercises" value={q} onChange={e => setQ(e.target.value)} /></label>
      </div>
      <div className="cards practice-cards">
        {shown.map(e => (
          <Link key={e.id} className="item-card practice-card" href={`/practice/${encodeURIComponent(e.id)}`}>
            <span className="eyebrow">{e.skills.map(label).join(' · ')}</span>
            <h3>{e.title}</h3>
            <div className="item-footer"><span className="badge">{e.difficulty}</span><span className="badge">{e.kind.replace('-', ' ')}</span>
              {passed.has(e.id) ? <span className="badge done"><Check size={12} />Passed</span> : attempted.has(e.id) ? <span className="badge">Attempted</span> : null}</div>
          </Link>
        ))}
        {!shown.length && !error && <div className="empty"><Dumbbell /><h3>No exercises here yet</h3><p>Register the concept in the Skill library and import a pack for it.</p></div>}
      </div>
    </PracticeShell>
  );
}
