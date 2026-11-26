'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ClipboardCopy, Library, Play, Plus, Search } from 'lucide-react';
import { PracticeShell } from '@/components/practice/PracticeShell';
import { listSkills, registerSkills } from '@/lib/practice/client/api';
import { listPacks, type PackSummary } from '@/lib/practice/client/packs';
import { resolveConcepts, type ResolvedConcept } from '@/lib/practice/concepts';
import { generationPrompt } from '@/lib/practice/prompt';
import { LANGUAGES, isSupported, NOT_SUPPORTED } from '@/lib/practice/adapters/registry';

type Skill = Awaited<ReturnType<typeof listSkills>>[number];
const STATES = ['introduced', 'practising', 'understood', 'proficient', 'mastered'];

export default function SkillLibrary() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [packs, setPacks] = useState<PackSummary[]>([]);
  const [error, setError] = useState('');
  const [q, setQ] = useState(''); const [langF, setLangF] = useState(''); const [stateF, setStateF] = useState('');
  const [form, setForm] = useState({ language: 'sql', concepts: '', source: '', notes: '', tags: '', difficulty: 'core', count: 10 });
  const [added, setAdded] = useState<ResolvedConcept[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => listSkills().then(setSkills).catch(e => setError(e.message));
  useEffect(() => { load(); listPacks().then(setPacks).catch(() => undefined); }, []);
  const exercisesFor = useMemo(() => { const m = new Map<string, number>(); for (const p of packs) for (const e of p.exercises) for (const s of e.skills) m.set(s, (m.get(s) ?? 0) + 1); return m; }, [packs]);
  const languages = [...new Set([...LANGUAGES.map(l => l.id), ...skills.map(s => s.language)])];
  const shown = skills.filter(s => (!langF || s.language === langF) && (!stateF || s.state === stateF) && (!q || [s.name, s.notes, s.source, ...s.aliases, ...s.tags].join(' ').toLowerCase().includes(q.toLowerCase())));

  async function add(e: React.FormEvent) {
    e.preventDefault(); setError(''); setCopied(false);
    const resolved = resolveConcepts(form.concepts, form.language, skills);
    if (!resolved.length) { setError('Enter at least one concept name.'); return; }
    setSaving(true);
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      await registerSkills(resolved.map(c => ({ id: c.id, language: c.language, name: c.name, aliases: c.alias ? [c.alias] : [], tags, source: form.source, notes: form.notes })));
      setAdded(resolved); await load();
    } catch (err) { setError((err as Error).message); } finally { setSaving(false); }
  }
  const prompt = added ? generationPrompt({ language: form.language, concepts: added, count: form.count, difficulty: form.difficulty, notes: form.notes, source: form.source }) : '';

  return (
    <PracticeShell active="Skill library">
      <div className="page-heading"><div><div className="eyebrow">EVERYTHING YOU’VE LEARNED, IN ONE PLACE</div><h1>Skill library</h1><p>Register a concept the moment you learn it, from any course or platform. Practice grows with it.</p></div></div>
      {error && <div className="error" role="alert"><span>{error}</span></div>}
      <section className="panel" aria-label="Add learned material"><form className="padded skill-form" onSubmit={add}>
        <h2><Plus size={18} /> Add learned material</h2>
        <div className="row wrap">
          <label>Language<input list="langs" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} required maxLength={40} /></label>
          <datalist id="langs">{languages.map(l => <option key={l} value={l} />)}</datalist>
          <label>Difficulty<select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}><option value="intro">intro</option><option value="core">core</option><option value="stretch">stretch</option></select></label>
          <label>Exercises wanted<select value={form.count} onChange={e => setForm({ ...form, count: Number(e.target.value) })}>{[5, 10, 20, 30].map(n => <option key={n}>{n}</option>)}</select></label>
        </div>
        <label>Concepts (comma or one per line)<textarea rows={2} value={form.concepts} onChange={e => setForm({ ...form, concepts: e.target.value })} placeholder="e.g. WITH clause, LEFT JOIN, UNION ALL" required /></label>
        <div className="row wrap">
          <label>Where you learned it<input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="e.g. Codecademy Learn SQL, lesson 7" maxLength={300} /></label>
          <label>Tags<input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="joins, reporting" /></label>
        </div>
        <label>Notes (optional)<textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} maxLength={10000} /></label>
        <button className="primary" disabled={saving}>{saving ? 'Saving…' : 'Register concepts'}</button>
      </form></section>

      {added && <section className="panel skill-result" aria-label="Registered concepts" aria-live="polite"><div className="padded">
        <h2>Registered {added.length} concept{added.length === 1 ? '' : 's'}</h2>
        <ul>{added.map(c => { const n = exercisesFor.get(c.id) ?? 0; return <li key={c.id}><strong>{c.name}</strong> <small>({c.id}{c.alias ? `, from “${c.alias}”` : ''})</small> — {n ? <>{n} exercise{n === 1 ? '' : 's'} ready</> : 'no exercises yet'}{!c.isNew && ' · already in your library (merged)'}</li>; })}</ul>
        {!isSupported(form.language) && <p className="muted">{NOT_SUPPORTED(form.language)}</p>}
        <div className="row wrap">
          {added.some(c => exercisesFor.get(c.id)) && <Link className="primary" href={`/practice?skills=${added.filter(c => exercisesFor.get(c.id)).map(c => c.id).join(',')}`}><Play size={15} />Practise now</Link>}
          <button className="secondary" onClick={() => navigator.clipboard.writeText(prompt).then(() => setCopied(true))}><ClipboardCopy size={15} />{copied ? 'Prompt copied' : 'Copy AI prompt for more exercises'}</button>
        </div>
        {added.some(c => (exercisesFor.get(c.id) ?? 0) < form.count) && <p className="muted">Fewer exercises than you asked for. Paste the prompt into any AI chat; importing the resulting pack arrives in Release 2.</p>}
      </div></section>}

      <div className="row between wrap practice-list-head">
        <h2>{shown.length} concept{shown.length === 1 ? '' : 's'}</h2>
        <div className="row wrap">
          <label className="search"><Search size={17} /><input placeholder="Search concepts, notes, tags…" aria-label="Search concepts" value={q} onChange={e => setQ(e.target.value)} /></label>
          <select aria-label="Filter by language" value={langF} onChange={e => setLangF(e.target.value)}><option value="">All languages</option>{languages.map(l => <option key={l}>{l}</option>)}</select>
          <select aria-label="Filter by state" value={stateF} onChange={e => setStateF(e.target.value)}><option value="">Any state</option>{STATES.map(s => <option key={s}>{s}</option>)}</select>
        </div>
      </div>
      <div className="cards practice-cards">
        {shown.map(s => <article key={s.id} className="item-card">
          <span className="eyebrow">{s.language}{s.tags.length ? ` · ${s.tags.join(', ')}` : ''}</span>
          <h3>{s.name}</h3>
          {s.source && <p>{s.source}</p>}
          <div className="item-footer"><span className="badge">{s.state}</span><span className="badge">{exercisesFor.get(s.id) ?? 0} exercises</span>
            {(exercisesFor.get(s.id) ?? 0) > 0 && <Link className="text-button" href={`/practice?skills=${s.id}`}>Practise</Link>}</div>
        </article>)}
        {!shown.length && <div className="empty"><Library /><h3>{skills.length ? 'No concepts match' : 'Nothing registered yet'}</h3><p>Add what you learned above.</p></div>}
      </div>
    </PracticeShell>
  );
}
