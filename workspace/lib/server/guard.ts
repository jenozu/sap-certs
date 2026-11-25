// Checks applied to every mutating request.
export function guardMutation(req: Request, maxBytes: number): Response | null {
  const json = (error: string, status: number) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
  if (req.headers.get('origin') !== new URL(req.url).origin) return json('Invalid request origin.', 403);
  if (!req.headers.get('content-type')?.startsWith('application/json')) return json('Expected JSON.', 415);
  const len = Number(req.headers.get('content-length') ?? 0);
  if (len > maxBytes) return json('Request is too large.', 413);
  return null;
}
