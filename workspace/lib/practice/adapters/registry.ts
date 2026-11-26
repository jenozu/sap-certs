// Language-neutral registry (no browser imports): which languages exist and how to load them.
// Adding a language = one entry here + an adapter module + packs. Nothing else changes.
import type { LanguageAdapter } from './types';

export interface LanguageInfo { id: string; label: string; status: 'available' | 'planned'; load?: () => Promise<LanguageAdapter> }

export const LANGUAGES: LanguageInfo[] = [
  { id: 'sql', label: 'SQL', status: 'available', load: () => import('./sql').then(m => m.sqlAdapter) },
  { id: 'javascript', label: 'JavaScript', status: 'planned' },
  { id: 'typescript', label: 'TypeScript', status: 'planned' },
  { id: 'node', label: 'Node.js', status: 'planned' },
  { id: 'python', label: 'Python', status: 'planned' },
];

export const normalizeLanguage = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '-');
export const languageInfo = (id: string): LanguageInfo | undefined => LANGUAGES.find(l => l.id === normalizeLanguage(id));
export const isSupported = (id: string) => languageInfo(id)?.status === 'available';

export async function loadAdapter(id: string): Promise<LanguageAdapter | null> {
  const info = languageInfo(id);
  return info?.status === 'available' && info.load ? info.load() : null;
}
export const NOT_SUPPORTED = (id: string) => `Practice for "${id}" isn't supported yet. You can still register concepts and save notes for it.`;
