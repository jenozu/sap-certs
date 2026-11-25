# Pathway v2 — Phase 0 audit

Status: **audit complete, awaiting owner approval.** No code, configuration, branch, database or deployment was changed while producing this audit.
Audit date: 2026-11-25.

## 1. Source snapshot

| Repository | Branch | SHA | Notes |
|---|---|---|---|
| jenozu/sap-certs | `main` | `7befba67a50cccf816f34e4c9aeb8f9e41a4219d` | Docs + original ChatGPT Sites/vinext/D1 workspace |
| jenozu/sap-certs | `feat/workspace-vercel-migration` | `b316f09c61b8745a03d421405162c697fca4f8cc` | Next.js on Vercel + Neon; diverged from main at `85d7623` |
| jenozu/playground | `main` | `59e409baf5c14eaff9b9c713bb80f1fa4ed169bd` | Personal Coding Academy, phases 0–5 merged (45 of 65 tasks done when phase-6 is counted) |
| jenozu/playground | `phase-6` | `683c8ab9e74aaafae1ed055b80fe1564c731e581` | Unmerged: progress, autosave, dashboard, notes/bookmarks, export/import (tasks 37–42, 65) |

Documents read: MASTER-PLAN.md and every document it links to (career roadmap, weekly schedule, course index and all seven course guides, SQL foundation checklist, projects index, SQL graduation project, portfolio standard, Practice Lab spec, workspace README), plus playground README, ARCHITECTURE, COURSE-FORMAT, DECISIONS, CHANGELOG, TASKS, parking lot and the source and tests for execution, evaluation, storage and the course system.

## 2. Baseline test results (actually run)

| Target | install | typecheck | lint | unit/integration | build |
|---|---|---|---|---|---|
| sap-certs `main` /workspace | ok | `tsc` pass | **fail**: 1 error, 7 warnings (`react-hooks` set-state-in-effect, page.tsx:19) | `workspace-unit.mjs` **PASS** (auth, phase order, persistence, sessions, stale-write, isolation, URL validation) | vinext build ok |
| sap-certs `feat/workspace-vercel-migration` /workspace | ok | `tsc` pass | not run | `workspace-unit.mjs` **FAIL** (still D1/header-based; route now returns 503 instead of 401) | `next build` ok (`/`, `/api/workspace`) |
| playground `main` | ok | pass | pass | Vitest **95/95 pass** (20 files) | ok; main chunk 1.14 MB (warning) |
| playground `phase-6` | (shared) | pass | not run | Vitest **106/106 pass** (23 files) | not run |

Playwright suites in playground were not run in this audit (they need a browser install); they will run in the Phase 2 gate.

## 3. Deployment and data state (verified via Vercel API, no secrets read)

- Vercel project **`career-roadmap`** (`prj_jZGBtWLodIqHWnzUF75lS2ucJjuI`, team `jenozus-projects`), framework Next.js, Node 22.
- **Production is not live.** Every production deployment from `main` is in `ERROR` (main still holds the vinext/Cloudflare build). The latest production attempts are the two doc commits from today.
- Preview deployments of `feat/workspace-vercel-migration` are `READY` (latest `b316f09`).
- Deployment protection: Vercel SSO protection **enabled for all deployments**; password protection off.
- Environment variables (names only): `DATABASE_URL` (production **and** preview, **same value**), `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` (left over from the removed GitHub sign-in).
- **Risk: previews write to the production database.** Because `DATABASE_URL` is shared, any preview deployment (including future feature branches) reads and writes the real Neon workspace.
- The branch's API route chooses the user ID by reading "the only row" in `workspaces` (`personal:vercel` if empty) and throws if there are two. This preserves the earlier GitHub-scoped row but is fragile: an accidental second row locks the app.
- Neon could not be inspected directly (no Neon connector in this session). Whether it currently holds a row, and from which deployment, must be confirmed by the owner.
- The original **ChatGPT Sites D1 database** may hold progress entered in the Sites version. It is not reachable from here; it can only be recovered through the app's "Export workspace" JSON button. There is **no import feature** today.
- Playground has **no deployment** (its hosting decision, task 54, is still open). Its progress is in browser IndexedDB on whichever device ran it.

## 4. What exists today

### Pathway workspace (sap-certs/workspace)
- Next.js 16 / React 19 / zod 3 / Tailwind 4 / shadcn UI kit. One 30 KB client component (`app/page.tsx`) switches between 8 views: Roadmap, Current phase, Weekly plan, Learning library, Projects, Portfolio, Career checkpoints, Compare next steps. Plus a goals/settings modal, item editor modal, session editor, JSON export, search, mobile drawer, focus trap and Escape handling.
- Data: one JSON document per user (`workspaces.data`, `version`), validated by `stateSchema` (≤1000 items, 500 KB request cap), optimistic revision check (409 on stale write), http(s)-only links.
- Item kinds: `phase` (sql, js, cap, python, btp), `course` (c1–c6), `project` (p1–p5, including RF scanner and batch shipping), `portfolio` (f1–f3), `job` (j1–j5, role targets, not postings), `option` (o1–o3). Sessions are keyed by date (one per day). `reviews` is a single text field.
- Seeds live in `app/model.ts`; existing records are not overwritten by seed changes because seeds only apply when no row exists.

### Personal Coding Academy (playground)
- Vite 8 / React 18 / zod 4 / react-router 7 / Tailwind 4 / CodeMirror 6 / sql.js / Pyodide / idb.
- Working: app shell and six pages; three-panel resizable lesson UI with mobile tabs; CodeMirror editor with themes; output panel (stdout, tables, errors, pass/fail); course system (zod schema, parser over a virtual file map with path checks, IndexedDB registry, safe Markdown renderer); execution manager (lazy engines, timeouts, worker terminate and respawn, Object.hasOwn guards); sql.js worker adapter (multi-result sets, zero-row columns, dataset reapply); Pyodide worker adapter; SQL and Python evaluators; Run vs Submit; progressive hints, solution view, reset; two sample courses.
- Placeholders on main: Practice, Progress and Projects pages. Progress/autosave/notes/export exist only on `phase-6`.

## 5. Reusable components (reuse, do not rebuild)

| Component | Source | Reuse plan |
|---|---|---|
| Execution manager | `src/execution/manager.ts` | Vendor as-is |
| sql.js adapter + worker + core | `src/execution/adapters/sql/*` | Vendor; worker needs the wasm URL injected instead of Vite `?url` (upstream change) |
| Python adapter | `src/execution/adapters/python/*` | Vendor later (Phase 8); not needed for SQL MVP |
| SQL evaluator | `src/features/exercise-evaluation/sql.ts` | Vendor; extend in Pathway with fixtures, required constructs, tolerance (wrapper, not fork) |
| Course schema + parser | `src/course-system/schema`, `parser` | Vendor; pack validator layers stricter rules on top |
| CodeMirror editor, FileTabs | `src/components/editor/*` | Vendor; verify React 19 |
| Output panel | `src/components/terminal/OutputPanel.tsx` | Vendor; add row/output caps |
| Safe Markdown renderer | `src/features/lesson-viewer/LessonMarkdown.tsx` | Vendor |
| Hints/solution helpers | `src/features/lesson/ExerciseHelpers.tsx` | Vendor; emit hint/solution-used events for "assisted" tracking |
| Autosave, export/import, progress calc | `phase-6` branch | Reuse patterns after phase-6 is merged; cloud versions live in Pathway |
| Workspace UI, revision checks, export, URL validation | sap-certs/workspace | Keep; extend |
| Neon repository + schema | feat branch `db/postgres/*` | Keep as the base for schema v2 |
| shadcn UI kit (50+ components) | workspace `components/ui` | Use for all new screens |

## 6. Missing functionality (vs. MASTER-PLAN and Practice Lab spec)

Career layer: stages 0–6 (only 5 phases exist; no stage 0, no TS/Node or Integration stage); the 14-course curriculum (only 6 generic seeds); last-reported Learn SQL 78% seed; course-to-skill links; certificate/phase fields exist but no skill links; job application tracker (none; `job` items are role targets); fit/gap explanations; project milestones, acceptance criteria, tests, screenshots, architecture, demo video, limitations, measured-vs-estimated impact; portfolio aggregation of publishable evidence; evidence-based checkpoints; weekly sessions linked to course/practice/project, default template from the schedule doc, structured weekly review; JSON **import**.

Practice layer: everything — Practice Lab, Skill Library, Assessments, ERP dataset, exercises, mastery, review queue, cloud persistence of attempts and drafts.

Evaluator gaps: no varied fixtures (hard-coded answers would pass), no required-construct check, no numeric tolerance, no output/row caps, no assisted-attempt signal.

Platform: working production deployment; a correct identity model; separate preview database; backups; schema beyond a single JSON blob (attempts would exceed the 500 KB cap); UI tests for the workspace (none exist).

## 7. Technical dependencies to add to the workspace

`@codemirror/*` 6.x + `codemirror`, `@lezer/highlight`, `sql.js` 1.16, `react-markdown` 10 + `remark-gfm` 4 (all already used by playground). Dev: `vitest`, `@testing-library/react`, `@playwright/test`, `@electric-sql/pglite` (test-only Postgres for repository tests; not used for learner SQL). Pyodide only when Python practice starts.

## 8. Architectural conflicts

| Conflict | Impact | Resolution (see ADRs) |
|---|---|---|
| Next.js 16 app vs Vite SPA | Workers/WASM loading differs; Vite `?url` imports break | ADR-004: framework-agnostic worker (wasm URL passed at init), sql.js wasm copied to `public/` |
| React 19 vs 18 | Vendored components must run on 19 | Spike task 3.1; components are hook-only and small |
| zod 3.25 vs zod 4 | Vendored schema imports `zod` v4 API | zod 3.25 ships the v4 API at `zod/v4`; vendored files import that path (spike verifies) |
| react-router vs App Router | Playground pages not reusable as-is | Reuse components, not pages; new App Router routes in Pathway |
| IndexedDB vs Neon | Two persistence models | Cloud is the record; IndexedDB only for offline drafts/queue (ADR-006) |
| Single JSON document vs relational needs | Attempts/reviews would blow the 500 KB cap; no relationships | ADR-005 (rev. 2): keep the document for existing views; additive tables for attempts, drafts, skills, packs, applications, reviews |
| Phases (5) vs stages (0–6) | IDs and meaning differ | ADR-007: keep existing phase IDs, add new stages, map; never move user items without confirmation |
| Main (Sites/D1) vs feat (Vercel/Neon) | Production broken; main deploys fail | ADR-001: harden and merge the feat branch, retire Sites scaffolding only after D1 export |
| Vercel SSO "only gate" + first-row user ID | Fragile identity, previews share prod DB | ADR-002/003: explicit `OWNER_ID`, separate preview database, fail-closed checks |

## 9. Owner decisions (resolved 2026-11-25)

1. Data: both Sites and Neon may hold relevant data → verify and back up both before any change (tasks 2, 10).
2. Auth: Vercel Authentication only, explicit server-side owner ID, no GitHub sign-in; verify production domain, previews and all API endpoints; stop and discuss if the plan cannot protect them (tasks 6, 7).
3. job-watch: a daily scheduled ChatGPT automation (not a repo or API) → CSV/JSON import + manual entry now, import contract designed for later automation (tasks 28, 29).
4. Playground phase-6: merge allowed once its acceptance criteria are met, all tests pass and the changes are reviewed (task 5).
5. Planning docs: committed to `docs/pathway-v2-plan` in jenozu/sap-certs; GitHub is the single source of truth.

## 10. Protection check (2026-11-25, unauthenticated requests)

| Target | Result |
|---|---|
| Preview deployment `career-roadmap-lk2832hsy-…/api/workspace` | **302 → vercel.com/login** (protected) |
| Production domain `career-roadmap-jenozus-projects.vercel.app/api/workspace` | Client error; no live production deployment exists yet, so it can't be fully verified. It will be verified at the first production deploy, made with `OWNER_ID` unset (task 7). |
| Project setting | `ssoProtection.deploymentType = all`, password protection off |
