// Dynamic concept library helpers (ADR-015). Aliases are suggestions seeded from content;
// any other concept from any course or platform becomes a new concept.
import { normalizeLanguage } from './adapters/registry';

export const SEED_ALIASES: Record<string, { id: string; name: string; aliases: string[] }[]> = {
  sql: [
    { id: 'sql-cte', name: 'WITH / CTE', aliases: ['with', 'with clause', 'cte', 'ctes', 'common table expression', 'common table expressions'] },
    { id: 'sql-left-join', name: 'LEFT JOIN', aliases: ['left join', 'left joins', 'left outer join', 'outer join'] },
    { id: 'sql-cross-join', name: 'CROSS JOIN', aliases: ['cross join', 'cross joins', 'cartesian product'] },
    { id: 'sql-union', name: 'UNION', aliases: ['union', 'unions'] },
    { id: 'sql-union-all', name: 'UNION ALL', aliases: ['union all'] },
    { id: 'sql-inner-join', name: 'INNER JOIN', aliases: ['inner join', 'join', 'joins', 'inner joins'] },
    { id: 'sql-aggregates', name: 'Aggregates (COUNT, SUM, AVG)', aliases: ['aggregates', 'aggregate functions', 'count', 'sum', 'avg', 'group by'] },
  ],
};

export const normalizeConcept = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}+#]+/gu, ' ').trim().replace(/\s+/g, ' ');
const singular = (s: string) => s.replace(/(\w{3,})s\b/g, '$1');
const slug = (s: string) => normalizeConcept(s).replace(/\+/g, 'plus').replace(/#/g, 'sharp').replace(/ /g, '-').slice(0, 80);

export interface ResolvedConcept { id: string; name: string; language: string; alias?: string; isNew: boolean }

/** Splits "a, b\nc" into concept names and maps each to a stable id (alias match or new). */
export function resolveConcepts(input: string, language: string, existing: { id: string; name: string; language: string; aliases: string[] }[] = []): ResolvedConcept[] {
  const lang = normalizeLanguage(language);
  const names = [...new Set(input.split(/[,\n;]+/).map(s => s.trim()).filter(Boolean))];
  const known = [...(SEED_ALIASES[lang] ?? []).map(a => ({ ...a, language: lang })), ...existing.filter(e => e.language === lang)];
  const out = new Map<string, ResolvedConcept>();
  for (const raw of names) {
    const n = normalizeConcept(raw);
    const hit = known.find(k => [k.name, k.id.replace(`${lang}-`, '').replace(/-/g, ' '), ...k.aliases].some(a => { const x = normalizeConcept(a); return x === n || singular(x) === singular(n); }));
    const r: ResolvedConcept = hit
      ? { id: hit.id, name: hit.name, language: lang, alias: normalizeConcept(hit.name) === n ? undefined : raw, isNew: !existing.some(e => e.id === hit.id) }
      : { id: `${slug(lang)}-${slug(singular(raw))}`, name: raw.trim(), language: lang, isNew: !existing.some(e => e.id === `${slug(lang)}-${slug(singular(raw))}`) };
    if (!out.has(r.id)) out.set(r.id, r);
  }
  return [...out.values()];
}
