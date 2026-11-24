# Pathway — SAP & coding career workspace

Private, account-scoped workspace with a durable D1 store. Includes an editable roadmap, phase checkpoints, date-specific weekly study plans, learning and certificate tracking, projects, portfolio links, career checkpoints, a next-step comparison view, and a decision journal.

## Editing and persistence

The starting plan is in `app/model.ts`. Existing user records are not replaced by later seed changes. The UI saves through `app/api/workspace/route.ts`; every database operation is scoped to the authenticated Sites user ID. Revision checks reject stale writes. Links accept HTTP and HTTPS only. JSON export is available in the footer.

The learning sequence starts with SQL, then JavaScript/TypeScript, Node.js/CAP, Python, and later BTP. Seeded experience is self-directed project work and SAP B1 operations, not professional software employment. Suggested roles are checkpoints, not live postings.

## Validation

- `npx tsc --noEmit`
- `node tests/workspace-unit.mjs` — route behavior against SQLite using the actual migration, including authentication, persistence, isolation, concurrency, and URL validation.
- Build via the Sites build helper.

Managed preview uses the Sites preview daemon. Its unauthenticated local browser does not supply a Sites user identity; edits are intentionally disabled until authenticated. Production sign-in is owned by Sites.

## Data model

`workspaces` stores one JSON document and revision per authenticated user. Schema-only SQL migrations live in `drizzle/`. Hosted migrations are applied by Sites during publishing. Local migration commands are separate from the hosted database.

## Local development

Requirements:

- Node.js 22.13 or newer
- npm (the exact dependency tree is pinned in `package-lock.json`)

Install and run the development server:

```bash
npm ci
npm run dev
```

The development server prints its local URL. The production app receives the
`oai-authenticated-user-id` header from ChatGPT Sites. A normal local browser
does not have that identity, so the interface can be previewed locally but
account-scoped loading and saving remain disabled by design.

Run the source checks:

```bash
npx tsc --noEmit
node tests/workspace-unit.mjs
npm run build
```

To exercise the built Cloudflare Worker with local D1 state, build first, apply
the migration to the generated Wrangler configuration, then start the worker:

```bash
npm run build
npx wrangler d1 migrations apply DB --local \
  --config dist/server/wrangler.json \
  --persist-to .wrangler/state
npm start
```

Local state is written beneath `.wrangler/`, which is ignored by Git. The
checked-in `.env.example` documents the deployment contract; the original Sites
deployment has no user-managed environment secrets.

## Deployment

The original application is a ChatGPT Sites/Vinext Cloudflare Worker. Its
deployment identity and D1 binding are declared in `.openai/hosting.json`, and
the Worker entry point is `worker/index.ts`.

No `vercel.json` is required by the original application. A direct Vercel deploy
is not equivalent because the API route imports the Cloudflare Workers runtime,
uses a D1 binding, and relies on the Sites-authenticated user header. Porting to
Vercel therefore requires a database and authentication adapter; adding a
Vercel configuration file alone would produce a misleading, non-functional
deployment.

## Public-repository safety

No production database, `.env` file, access token, credential, or private key is
included. User workspace records remain in the hosted D1 database and are not
part of this source tree.
