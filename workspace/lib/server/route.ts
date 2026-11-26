// Shared route plumbing: owner resolution (fail closed), guard, JSON body + zod.
import type { z } from 'zod';
import { resolveOwner, OwnerNotConfigured } from './owner';
import { guardMutation } from './guard';

export const json = (b: unknown, status = 200) => Response.json(b, { status, headers: { 'Cache-Control': 'no-store' } });

export function ownerOr503(): { owner: string } | { res: Response } {
  try { return { owner: resolveOwner() }; }
  catch (e) { if (e instanceof OwnerNotConfigured) return { res: json({ error: 'Server not configured.' }, 503) }; throw e; }
}

export async function readBody<S extends z.ZodType>(req: Request, schema: S, maxBytes = 64_000): Promise<{ data: z.infer<S> } | { res: Response }> {
  const blocked = guardMutation(req, maxBytes);
  if (blocked) return { res: blocked };
  const raw = await req.text();
  if (raw.length > maxBytes) return { res: json({ error: 'Request is too large.' }, 413) };
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return { res: json({ error: 'Invalid JSON.' }, 400) }; }
  const r = schema.safeParse(parsed);
  if (!r.success) { const i = r.error.issues[0]; return { res: json({ error: `Invalid ${i.path.join('.') || 'request'}: ${i.message}`, field: i.path.join('.') }, 400) }; }
  return { data: r.data };
}

export const serverError = () => json({ error: 'Something went wrong. Your saved data is unchanged.' }, 503);
