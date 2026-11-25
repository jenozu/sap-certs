// ADR-002: fail if Vercel Authentication does not cover all deployments.
// Read-only. Needs VERCEL_TOKEN (scoped read token); skips with a warning if absent.
const token = process.env.VERCEL_TOKEN;
const project = process.env.VERCEL_PROJECT_ID ?? 'prj_jZGBtWLodIqHWnzUF75lS2ucJjuI';
const team = process.env.VERCEL_TEAM_ID ?? 'team_xcTzjB73yoa3h7Yhif3KFDsy';
if (!token) { console.warn('check-protection: VERCEL_TOKEN not set; skipped'); process.exit(0); }
const r = await fetch(`https://api.vercel.com/v9/projects/${project}?teamId=${team}`, { headers: { Authorization: `Bearer ${token}` } });
if (!r.ok) { console.error(`check-protection: Vercel API ${r.status}`); process.exit(1); }
const p = await r.json();
const scope = p.ssoProtection?.deploymentType;
if (scope !== 'all') { console.error(`check-protection: Vercel Authentication scope is "${scope ?? 'off'}", expected "all"`); process.exit(1); }
console.log('check-protection: Vercel Authentication covers all deployments');
