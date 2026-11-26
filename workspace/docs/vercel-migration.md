# Vercel / Neon setup (current)

- Hosting: Vercel project `career-roadmap` (Next.js, Node runtime).
- Access: **Vercel Authentication only** (Deployment Protection, scope "All deployments"). It must cover the production domain, preview URLs and every `/api` route. No app-level sign-in.
- Owner: fixed server-side `OWNER_ID`. If it is missing, the API answers 503 and serves no data. Identity never comes from request headers.
- Database: Neon project `career-roadmap`. Production uses branch `main`, previews use branch `preview`, and `backup-*` branches are point-in-time copies. Two `DATABASE_URL` entries, scoped Production and Preview.
- Environment variables: `DATABASE_URL` (secret, per environment), `DB_ENV` (`production`/`preview`), `OWNER_ID`.
- Health: `GET /api/health` → `{ ok, dbEnv, ownerConfigured, schemaVersion }` (no data, no secrets).
- Plan and status: `docs/pathway-v2/` (see `CHECKLIST.md`).
