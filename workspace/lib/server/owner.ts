// ADR-002/003: Vercel Authentication is the only access gate; the owner is a
// fixed server-side value. Identity never comes from the request or the data.
export class OwnerNotConfigured extends Error {}
export function resolveOwner(): string {
  const id = process.env.OWNER_ID?.trim();
  if (!id || id.length > 100) throw new OwnerNotConfigured('OWNER_ID is not configured');
  return id;
}
