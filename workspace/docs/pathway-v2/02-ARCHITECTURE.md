# Pathway v2 — Architecture (revision 2)

Status: proposal for approval. Nothing is implemented until the owner approves and the matching task lands. Revision 2 removes revision 1's full relational migration and page split in favour of additive changes (owner principle: no unnecessary complexity).

## 1. System overview

```
Browser (single owner; Vercel Authentication in front of every URL)
 ├─ Existing workspace UI (app/page.tsx, 8 views, unchanged design)  ── /api/workspace (JSON document)
 ├─ Practice Lab, Skill Library, Job tracker (new routes, same design tokens)
 │    └─ vendored playground engine ── Web Worker: sql.js (WASM) on in-memory fixtures   ← learner SQL never leaves the browser
 └─ IndexedDB: offline drafts + unsent attempts, replayed with idempotency keys
        │ same-origin JSON
Vercel Functions (Node runtime)
 ├─ resolveOwner() = OWNER_ID (fail closed) → request guard → zod → owner-scoped repositories (Drizzle)
 └─ pack validation, imports (never execute learner code)
        │
Neon Postgres: main branch (production) · preview branch (previews) · backup-* branches
```

Content (datasets, exercise packs, skill aliases, career seeds) is versioned in Git under `workspace/content/`. User data lives only in Neon.

## 2. Architecture decision records

**ADR-001 Build on the Vercel/Neon branch; retire Sites after confirmation.** Harden and merge `feat/workspace-vercel-migration`. Keep Sites/vinext/D1 files until Sites data has been exported, reconciled and the owner confirms (task 12).

**ADR-002 Vercel Authentication only (owner decision).** No GitHub sign-in and no app-level login. Protection scope must stay `all` (production domain, deployment URLs, previews, API routes). `scripts/check-protection.mjs` (Vercel API, read-only) fails CI if the scope changes. The first production deploy runs with `OWNER_ID` unset, so the API returns only 503 until unauthenticated checks of the production domain, a preview and the API all redirect to Vercel login. If the current plan cannot provide this, work stops and alternatives are discussed.

**ADR-003 Explicit server-side owner.** `resolveOwner()` returns `process.env.OWNER_ID` or the route fails with 503. Production `OWNER_ID` = the existing Neon `workspaces.user_id` (preserves the row). Identity never comes from a request header or from "the only row".

**ADR-004 Engine reuse: pinned vendored snapshot.** After the Phase-1 spike succeeds, two small upstream playground PRs remove the only framework-specific code (worker receives `wasmUrl` in its `init` message; one zod import module mapped to `zod/v4`, which zod 3.25 provides). Modules are copied to `workspace/vendor/playground/` with `UPSTREAM.json` (SHA, files, sha256). `scripts/sync-playground.mjs` updates them, and an integrity test fails on local edits. Pathway behaviour lives in `lib/practice/` wrappers. The worker is created inside client-only components with `new Worker(new URL(…, import.meta.url), {type:'module'})`. `sql-wasm.wasm` is copied to `public/sqljs/` at prebuild. Rejected: monorepo package (more tooling than needed now) and iframe embedding (two stores, no shared progress).

**ADR-005 Additive data model (revised).** The existing `workspaces` JSON document stays the store for the existing career views. New features add only the tables they need (section 3). The document schema is extended with optional fields in Release 5, so old documents stay valid and the UI keeps working. This is reconsidered only if the document approaches its 500 KB cap. High-volume data (attempts, drafts, packs, applications, reviews) is always relational.

**ADR-006 Persistence rules.** Owner-scoped queries everywhere. Mutable rows carry `rev` (stale write → 409 with the server copy). Appends (attempts, application events) are insert-only with a client-generated id as the idempotency key. Offline drafts and attempts queue in IndexedDB. zod validation with size caps on every route. The existing document keeps its `version` check. `workspace_snapshots` stores a full copy before every import, seed or reconciliation.

**ADR-007 Stages without moving user data (Release 5).** Existing phase ids stay. New stage items are added: `now` (0), `ts-node` (3), `integration` (5). Titles are retitled only on unedited seed items. Items are never re-parented automatically; the owner accepts suggestions one at a time.

**ADR-008 Idempotent seeding into the document (Release 5).** A seed adds an item only when its id is missing and never modifies an existing item. Learn SQL 78% is marked `progressSource: last-reported` only if no item has the Learn SQL URL.

**ADR-009 Pack format = COURSE-FORMAT v1 + optional fields.** Lessons/exercises may carry `exerciseId`, `skills`, `difficulty`, `kind`, `businessPurpose`, `exerciseVersion`. SQL tests may carry `fixtures`, `requiredConstructs`, `numericTolerance`, `ignoreColumnNames`. The playground ignores these fields (its schema is non-strict), so packs stay compatible. The Pathway validator is stricter: ids, skills, solution, ≥2 fixtures for graded items, 2 MB/pack, 200 KB/file, 500 files, no absolute or `..` paths, no duplicate ids, no version downgrades.

**ADR-010 Execution safety.** sql.js runs in a worker with a 5 s timeout (10 s in assessments), then terminate and respawn. Output caps: 1,000 rows shown, 2 MB, 50 result sets. Fixtures are rebuilt from deterministic SQL on reset. CSP: `script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'`. Markdown is rendered without raw HTML.

**ADR-011 Mastery as pure functions over attempts (Release 4).** States are derived from attempt history with an injectable clock, so they can be recomputed retroactively.
- Independent: passed, no hint, no solution, and not a repeat pass of the same exercise within 24 h.
- Distinct: counted per exercise id.
- Mixed: in a mixed session or an assessment.
- Delayed: two passes ≥7 days apart after reaching proficient.
- Review steps: 1/3/7/14/30 days. An independent pass moves up a step, an assisted pass stays, a fail resets to step 1.

**ADR-014 Language adapters (multi-language academy, 2026-11-26).** `lib/practice/adapters/index.ts` holds a registry keyed by language id (`sql`, later `javascript`, `typescript`, `node`, `python`…). Each adapter provides: `label`, `dialectNote`, `editorLanguage`, `createEngine()` (isolated: Web Worker or sandboxed iframe, with timeout/terminate), `evaluate(code, tests, ctx)` returning a shared result shape `{passed, checks[], constructOk?, output}`, and `validatePackExtras(pack)` for language-specific pack rules. Practice UI, storage, attempts, mastery, review and assessments only see the shared shapes. SQL wraps the vendored playground sql adapter; Python will wrap the vendored Pyodide adapter; JS/TS get a sandboxed-iframe adapter (designed in task 45). An unknown language shows "not supported yet" instead of failing.

**ADR-015 Dynamic concepts and learning material.** Concepts (`skills`) are per-owner rows with free-text `language`, `aliases`, `tags`, `source`; there are no topic enums or category tables. Aliases seeded from content are suggestions only. `learning_materials` (Release 2) store notes, lesson text, code examples and links linked to concepts; full-text search via Postgres `to_tsvector` over title/body/tags. Materials can be passed into the generation prompt.

**ADR-017 Curriculum and lessons as data (PROPOSED 2026-11-27, awaiting approval).** The pack is the course: the manifest already models course → modules → lessons with lesson types and minutes, so no second format is introduced.
- *Additive optional fields* (non-strict, playground-compatible): lesson `skills[]` (concept ids), advisory `prerequisites[]` (lesson ids), `quiz` file for multiple-choice, exercise `role` guided|independent. Lessons without exercises become valid.
- *No curriculum content table.* The catalogue is derived from bundled and published pack manifests (task 24) in one registry; only user state is new: `lesson_progress` (Release 2).
- *Hierarchy:* language → course → module → lesson → concept, where concepts are the existing dynamic `skills` (ADR-015). Order and concept links are data, so new languages, courses and lessons need no code changes.
- *Lesson blocks are content:* runnable examples, syntax callouts, guided checkpoints and quizzes are declared in lesson files and rendered by one viewer through the adapter registry (ADR-014), reusing the vendored lesson Markdown renderer (no raw HTML) and the focus-view editor.
- *Progress is not mastery.* Lesson completion tracks progression only; guided-exercise attempts use mode `lesson-guided` and are never independent evidence; weights belong to ADR-016 (task 49). Prerequisites advise, never gate (ADR-012).
- *Fit:* external courses in the workspace document link via optional `curriculumCourseId` (task 35); learning materials stay personal notes and search also covers lesson text (task 48); the adaptive recommender and dashboard use lesson links and progress (tasks 50, 51).

**ADR-016 Adaptive learning (2026-11-26). Amendment approved by owner (A18); the scoring, mastery, interval and recommendation numbers remain a separate approval checkpoint in task 49 and are not implemented until approved.** Requirements: `ADAPTIVE-LEARNING.md`. Decisions proposed here, numbers deferred to task 49:
- *Three pure, language-neutral domain modules* over attempts: `mastery.ts` (discrete states, ADR-011), `proficiency.ts` (0–100% per concept plus a separate evidence-sufficiency verdict), `review.ts` (adaptive intervals). `recommend.ts` composes them with the Release 2 selector (`lib/practice/select.ts`). None contains SQL logic; they see only the shared attempt shape.
- *No new Release 1 data.* Attempts already store skills, mode, hints, solution views, independent flag, version, duration and per-check results, so recurring error kinds, independent first attempts and repeat detection are derived. Mastery and proficiency stay recomputable from history, so nothing needs backfilling.
- *Evidence rules:* only graded modes count; sandbox never does; assisted and repeated identical passes do not raise independent proficiency; insufficient evidence is a distinct state, never a percentage band and never mastery; course completion is not mastery.
- *Settings* live in one owner-scoped `learning_settings` row with `rev` (threshold default 80% inclusive, review budget 15/30/45/60, adaptive difficulty, spaced repetition, weekly assessment frequency, mastery requirements, new-learning/review balance). Changing a setting changes recommendations without code or content changes.
- *Aggregation:* concept → pack module → language in Release 4; course in Release 5 through item `skills[]` (ADR-005), reusing the same aggregator.
- *Content gaps:* the recommender returns a gap (concept, error kinds, target difficulty and count) that opens pack import (task 24) or the pre-filled AI prompt (task 25); no AI provider.
- *Scheduling never gates:* the daily queue fits inside the weekly plan and never blocks new learning (consistent with ADR-012).
- The formula, minimum evidence counts, delayed-retention rule, interval adjustments and selection weights are proposed in task 49 with numeric test vectors and need explicit owner approval (task 49) before task 31 or any adaptive implementation starts.

**ADR-012 Readiness and fit explain, never gate.** Apply/track actions are always enabled.

**ADR-013 Job import contract `pathway.jobs.v1`.** JSON array or CSV with a header.
- Required: `title`, `company`, `url`.
- Optional: `remote`, `canada_eligible`, `salary_text`, `requirements`, `suitability`, `posted_at`, `source`, `external_ref`.
- One handler serves the UI upload. A later token-authenticated endpoint for the daily ChatGPT job-watch can reuse it without redesign.
- Dry run returns new/duplicate/invalid rows. Duplicates are matched by canonical URL or by `source`+`external_ref`. Apply is idempotent.

## 3. Data model by release (additive Drizzle migrations)

| Release | Tables | Notes |
|---|---|---|
| 0 | `workspaces` (existing, unchanged), `workspace_snapshots` (id, source, data jsonb, created_at) | Snapshots before imports/seeds |
| 1 | `skills` (owner_id, id, language, name, aliases text[], tags text[], state, source, notes, rev), `exercise_attempts` (insert-only; see PRD C4), `saved_code` (exercise_id, code, rev), `practice_sessions` (config jsonb, times) | Bundled packs are read from `content/` and not stored |
| 2 | `packs`, `pack_versions` (language, status, manifest, files jsonb, validation report, published_at), `learning_materials` (language, kind, title, body, url, concept ids, tags, source), `lesson_progress` (course, lesson, pack version, status, detail jsonb, completed_at, rev) | Imported/authored packs (whole courses) for any language; searchable learning material; curriculum derived from pack manifests |
| 3 | `job_applications`, `application_events` | ADR-013 |
| 4 | `review_queue`, `assessment_attempts`, `learning_settings` | Assessments defined in content; settings are one row per owner; proficiency and recommendations are computed, not stored |
| 5 | none (document extended) | ADR-005/007/008 |

Every table has `owner_id`, `created_at` and `updated_at`; every practice table (skills, attempts, drafts, sessions, packs, materials) has a free-text `language`. Attempts reference `(exercise_id, exercise_version, content_hash)`.

## 4. API (all owner-scoped, zod-validated, same-origin)

- **Existing:** `GET/PUT /api/workspace`, plus `POST /api/workspace/import?dryRun=1` (Release 0) and `GET /api/health`.
- **Release 1:** `GET/POST /api/v2/skills`, `POST /api/v2/skills/register`, `POST /api/v2/attempts`, `GET/PUT /api/v2/drafts/:id`, `POST /api/v2/practice-sessions`, `GET /api/v2/export`, `POST /api/v2/import`.
- **Release 2:** `POST /api/v2/packs` → `/:id/validate` → `/:id/publish`; `GET /api/v2/curriculum`, `PUT /api/v2/lesson-progress`.
- **Release 3:** CRUD `/api/v2/applications`, `POST /api/v2/applications/:id/events`, `POST /api/v2/applications/import?dryRun=1`.
- **Release 4:** `GET /api/v2/review-queue`, `POST /api/v2/assessment-attempts`, `GET /api/v2/recommendations`, `GET/PUT /api/v2/settings`.

## 5. Deployment, backup, rollback

Production uses Neon main; previews use the Neon `preview` branch (separate `DATABASE_URL`, set by the owner; Claude never handles the value). Before each production change: a Neon `backup-*` branch and an owner JSON export. Migrations are additive and applied explicitly, preview first. Rollback: Vercel rollback, Neon branch restore, snapshots. CI: GitHub Actions with Playwright against previews through the protection-bypass secret.

## 6. Security checklist

Vercel Authentication on all deployments, checked in CI; fail-closed `OWNER_ID`; same-origin + JSON + size checks on mutations; zod everywhere; parameterised queries; no secrets in the repo or client; CSP; worker isolation with caps and timeouts; sanitised Markdown; server-side pack validation; synthetic data only.
