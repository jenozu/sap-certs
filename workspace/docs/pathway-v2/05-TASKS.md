# Pathway v2 — implementation tasks (revision 2)

Generated from `.taskmaster/tasks/tasks.json` (source of truth). Status: **all pending, awaiting approval of revision 2.** Complexity 1–10; tasks scored 7+ without subtasks are broken down just before they start.


## Phase 0 — Approval

### 1. Owner approval of the revised plan  [HUMAN]
Priority **high** · complexity 1

Record the owner's decisions (2026-11-25) and approval of plan v2.

**How:** Decisions already given: back up and verify both Sites and Neon; Vercel Authentication only + server-side OWNER_ID, stop if the plan cannot protect production/previews/API; job-watch = daily ChatGPT automation, CSV/JSON import + manual entry, import designed for later automation; phase-6 merge allowed if its criteria and tests pass; plan docs on docs/pathway-v2-plan. Remaining: approve plan v2.

**Acceptance: prd.md decision log has an 'approved v2' entry; no application code changed before it.**


## Phase 1 — Platform safety, data preservation, compatibility spike → Release 0

### 2. Verify and back up Sites and Neon data  [HUMAN + script] _(after 1)_
Priority **high** · complexity 3

Know exactly what data exists in both stores before any change.

**How:** Owner: (a) Sites app → 'Export workspace' → save JSON; (b) current Vercel preview → 'Export workspace' → save JSON (this is the Neon copy); (c) Neon console → create branch `backup-pre-v2` from main; (d) run the read-only SQL in docs/pathway-v2/06-OWNER-ACTIONS.md (row count, version, md5 of data) and paste the output. Claude: `scripts/compare-exports.mjs a.json b.json` (local, read-only) reports item counts by kind, sessions count, and every item that differs by id/field, and which side is newer by field content. Exports stay outside the repo.

**Acceptance: both exports parse with stateSchema; Neon backup branch exists; comparison report recorded in the task log (counts and ids only, no note text); owner confirms which copy is authoritative per differing item.**

### 3. Isolate preview database from production  [HUMAN env value] _(after 2)_
Priority **high** · complexity 3

Stop preview deployments from writing the production Neon data.

**How:** Owner: Neon branch `preview` from main; in Vercel set DATABASE_URL Production-only (existing) and a new Preview-scoped DATABASE_URL for the preview branch (Claude never sees the value). Claude: add DB_ENV (production/preview) and GET /api/health → {ok, dbEnv, schemaVersion} with no data or secrets.

**Acceptance: a new preview reports dbEnv=preview; editing data on the preview leaves the production md5 from task 2 unchanged.**

### 4. Playground compatibility spike (moved early) _(after 3)_
Priority **high** · complexity 8

Find integration blockers before building on the engine.

**How:** Throwaway route /lab-spike on a spike branch: copy (not yet vendor) playground CodeEditor, OutputPanel, execution manager and sql worker; run in Next 16 production build on React 19; zod/v4 import of the course schema; sql-wasm.wasm served from public/sqljs with the worker receiving wasmUrl; CSP header; deploy to the isolated preview.

**Acceptance: on the preview (desktop and a phone) a fixture query renders a table; a runaway recursive CTE is stopped at 5 s and the next run works; no CSP or hydration errors; written result (works / blockers + fallback) logged. If a blocker has no fallback, stop and discuss before Phase 2.**
- [ ] **4.1** Worker + wasm under Turbopack production build — test: preview: SELECT 1 returns a table
- [ ] **4.2** CodeMirror editor on React 19 — test: typing, undo, theme work; vitest mount
- [ ] **4.3** zod/v4 parse of sample course.json — test: vitest parses sql-fundamentals
- [ ] **4.4** CSP + timeout/terminate + mobile (after 4.1) — test: console clean; runaway stopped; 390px usable

### 5. Review and merge playground phase-6 _(after 1)_
Priority **medium** · complexity 4

Owner-approved, conditional on its own criteria.

**How:** In jenozu/playground: review the 26-file diff (tasks 37–42, 65) for regressions and security; run its gate (task 43): lint, typecheck, vitest, build, Playwright incl. new autosave/dashboard/notes/progress specs; confirm phase 1–5 e2e still pass; open PR phase-6 → main with results; merge; record SHA. Requires push access to playground.

**Acceptance: PR shows all checks green (106+ unit tests, all e2e) and a written review; merged SHA logged; playground TASKS.md shows tasks 37–43 done.**

### 6. Server-side owner identity, fail-closed API, cleanup _(after 3)_
Priority **high** · complexity 5

Vercel Authentication only, with an explicit owner (ADR-002/003).

**How:** lib/server/owner.ts resolveOwner() = process.env.OWNER_ID or 503 'Server not configured'. Production OWNER_ID = existing Neon workspaces.user_id (from task 2 output); preview gets its own. Shared request guard: same-origin, JSON content-type, size cap. Remove next-auth dependency; remove stale AUTH_* env vars (owner OK given in decision 2). Fix pre-existing lint error page.tsx:19 without behaviour change. Update README and docs/vercel-migration.md.

**Acceptance: lint/typecheck/build green; route tests: OWNER_ID unset → 503, foreign Origin → 403, non-JSON → 415, stale version → 409, valid → 200; a second workspaces row no longer breaks loading.**

### 7. Verify protection of production domain, previews and API (stop condition) _(after 6)_
Priority **high** · complexity 3

Owner requirement: confirm Vercel Authentication covers everything on the current plan.

**How:** Read settings via Vercel API (ssoProtection.deploymentType must be 'all'; already set). Unauthenticated HTTP checks of /, /api/health, /api/workspace on: a preview URL, the branch alias, and the production domain career-roadmap-jenozus-projects.vercel.app. Production is checked on the first production deploy made with OWNER_ID unset, so even an unprotected domain could return only 503 and no data; OWNER_ID is set only after the checks pass. scripts/check-protection.mjs runs the settings check in CI. If any target is reachable without Vercel login, stop and discuss alternatives (e.g. Pro 'all deployments' scope, password protection, app-level secret).

**Acceptance: every target returns a redirect to vercel.com/login (or 401) when unauthenticated; result table logged. Already verified 2026-11-25: preview /api/workspace → 302 vercel.com/login.**

### 8. Test harness: Vitest + PGlite + Playwright + CI _(after 6)_
Priority **high** · complexity 5

Real test suites for the workspace.

**How:** vitest, @testing-library/react, @electric-sql/pglite (test-only, runs the real Drizzle Postgres migrations), @playwright/test, @axe-core/playwright. Port every assertion of tests/workspace-unit.mjs to a PGlite route test. Playwright against local `next start` or PREVIEW_URL with the protection-bypass header from env. GitHub Actions: lint, typecheck, unit, integration, build, e2e on the preview.

**Acceptance: npm test, npm run test:integration, npm run test:e2e green locally and in CI; original seven behaviours asserted.**

### 9. Regression and visual baseline of existing workspace _(after 8)_
Priority **high** · complexity 5

Lock existing functionality and visual design before adding anything.

**How:** e2e/regression at 1440px and 390px: all 8 views render; edit item; add course; filters; search; weekly session edit and week navigation; settings; export; modal Escape/focus trap; mobile drawer; 409 message. Playwright toHaveScreenshot baselines per view (visual design lock). axe baseline (fail on new violations only).

**Acceptance: suite and screenshots green against the current preview build; baselines committed.**

### 10. Snapshots and validated import to reconcile Sites/Neon data _(after 2, 8)_
Priority **high** · complexity 5

Bring any newer Sites data into Neon without losing anything.

**How:** Additive table workspace_snapshots (id, source, data jsonb, created_at). POST /api/workspace/import?dryRun=1 accepts the existing export format {exportedAt, workspace}: validates with stateSchema, returns per-item diff (add / differs / same) and sessions diff. Apply: snapshot current doc first, add missing items/sessions, and for differing items use the owner's per-item choice from task 2 (default: keep current, copy the other version into notes). Never deletes. Import button in the settings modal using existing styles.

**Acceptance: PGlite tests: double import is a no-op; nothing removed; snapshot row created before change; malformed file and javascript: URLs rejected with field paths. Preview rehearsal with the real export files gives the expected diff.**

### 11. Release 0: merge to main, production live, data reconciled  [HUMAN approval] _(after 4, 5, 7, 9, 10)_
Priority **high** · complexity 3

Production on Vercel/Neon, protected and backed up.

**How:** Merge main's doc commits into the Vercel branch; PR with CI green; owner approves; merge. First production deploy with OWNER_ID unset → run task 7 production checks → set OWNER_ID → redeploy. Fresh Neon backup branch, then apply the reconciliation import on production if task 2 found newer Sites data.

**Acceptance: production READY and protected (task 7 table); regression suite read-only subset green on production; production data matches the agreed reconciliation; CHANGELOG records test results.**

### 12. Retire Sites/vinext scaffolding after owner confirmation _(after 11)_
Priority **low** · complexity 2

Remove the Cloudflare/Sites build once Sites data is confirmed safe.

**How:** Remove worker/, wrangler, vinext, @cloudflare/*, .openai/hosting.json, Sites scripts/plugins, D1 db/index.ts; move drizzle/ D1 migration to docs/legacy/. One revertible commit.

**Acceptance: all suites green; no cloudflare/vinext dependencies; owner confirmation logged.**


## Phase 2 — Usable SQL Practice Lab + Skill Library v1 → Release 1

### 13. Vendor the playground engine (pinned snapshot) _(after 11)_
Priority **high** · complexity 4

ADR-004 using the spike's findings.

**How:** Upstream PR to playground: sql worker accepts wasmUrl in init (fallback to Vite ?url), single zod import module; merge; then copy the listed modules to workspace/vendor/playground with UPSTREAM.json (sha, files, sha256), scripts/sync-playground.mjs, tests/vendor-integrity.test.ts, prebuild copy of sql-wasm.wasm. Delete the spike route.

**Acceptance: integrity test fails if a vendored file is edited; ported vendored unit tests pass; build green; playground CI green.**

### 14. Practice tables and owner-scoped API _(after 11)_
Priority **high** · complexity 6

Only the tables Release 1 needs; additive migration.

**How:** Tables: skills (owner-scoped: id slug, language, name, aliases text[], state default 'introduced', source, notes), exercise_attempts (insert-only, client id = idempotency key; exercise_id, exercise_version, content_hash, pack_id, code, passed, construct_ok, results jsonb, hints_used, solution_viewed, independent, mode, practice_session_id, duration_ms, started_at, submitted_at), saved_code (exercise_id, code, rev), practice_sessions (id, config jsonb, started_at, ended_at). Repository helpers always filter owner_id; rev-checked updates; ON CONFLICT DO NOTHING inserts; zod schemas shared with client; body caps. Routes under /api/v2.

**Acceptance: PGlite tests: owner isolation, duplicate attempt id → one row, stale rev → 409, oversize → 413; migration applies on top of the production schema; workspaces table untouched.**

### 15. Evaluator extensions: fixtures, constructs, equivalence, caps _(after 13)_
Priority **high** · complexity 6

Robust, fair grading.

**How:** lib/practice/evaluate.ts wraps vendored evaluateSql: per-fixture runs with expected results from the reference solution; ignoreColumnNames default true; numericTolerance; requiredConstructs checked on comment/string-stripped tokens and reported separately; caps 1,000 rows shown / 2 MB / 50 result sets. Old test files behave exactly as before.

**Acceptance: vitest: hard-coded rows pass fixture A but fail B; alias-renamed correct query passes; missing LEFT JOIN or UNION ALL flagged by construct check; 1 vs 1.0 within tolerance passes; playground sample course tests unchanged.**

### 16. Pack format, validator and bundled-pack loader _(after 15)_
Priority **high** · complexity 5

One content path for bundled and (later) imported packs; no code change per concept.

**How:** ADR-009 optional fields on course.json v1 (exerciseId, skills, difficulty, kind, businessPurpose, exerciseVersion; tests: fixtures, requiredConstructs, numericTolerance, ignoreColumnNames). lib/practice/pack-validator.ts (strict rules, size/path/ID checks). Bundled packs under content/packs/* built into a manifest at build time. `npm run content:verify` runs every reference solution on every fixture in Node sql.js.

**Acceptance: validator unit test per rejection rule (bad JSON, traversal, absolute path, oversize, duplicate id, missing solution, <2 fixtures); a valid pack loads; content:verify runs in CI.**

### 17. Synthetic distributor dataset and fixtures _(after 16)_
Priority **high** · complexity 5

Deterministic ERP data with deliberate edge cases.

**How:** content/packs/sql-erp-core/datasets/base.sql, variant-b.sql, variant-c.sql: suppliers, customers, products, warehouses, purchase_orders/lines, receipts/lines, invoices/lines, sales_orders/lines, shipments, inventory_movements; unmatched rows, duplicate cities, partial receipts, NULLs, multiple branches, discrepancies; fictional names only; docs/dataset.md.

**Acceptance: content:verify loads all fixtures; each listed edge case has a documented query proving it exists; variants share the schema with different values.**

### 18. Priority exercises: WITH/CTE, LEFT JOIN, CROSS JOIN, UNION, UNION ALL _(after 17)_
Priority **high** · complexity 7

The owner's immediate learning priorities, 25 verified exercises.

**How:** Pack sql-erp-core v1.0.0: 5 LEFT JOIN (missing orders, unsold products…), 5 CROSS JOIN (warehouse/product matrix…), 5 UNION/UNION ALL (at least 2 require UNION ALL and 2 UNION, incl. duplicate-handling contrast; branch shipments), 5 WITH/CTE (supplier spend, outstanding receipts…), 5 mixed. Each: business purpose, instructions, starter, ≥2 hints, tests with fixtures + requiredConstructs, verified solution.

**Acceptance: content:verify passes all 25 on all fixtures; a hard-coded answer fails every graded exercise; owner reviews 5 samples before release.**

### 19. Practice focus view with attempt recording from day one _(after 14, 16)_
Priority **high** · complexity 7

Run/Submit/reset/hints/solution/drafts; every Submit is stored.

**How:** /practice/[exerciseId]: instructions, schema browser, editor, output, progressive hints, solution (confirm), Run (free), Submit (evaluate + POST attempt with hints_used, solution_viewed, independent flag, version, duration), Reset sandbox (fixture re-init, keeps draft), Restore starter (separate). Drafts: debounced cloud save + IndexedDB offline queue for drafts and unsent attempts. SQLite dialect label. Existing visual design tokens (globals.css). Desktop panels, mobile tabs.

**Acceptance: e2e: run; pass and fail submits each create one attempt row; double-click submit → one row; offline submit appears after reconnect; reset keeps draft; reload restores draft; 390px usable; axe clean.**
- [ ] **19.1** Layout + schema browser — test: e2e desktop/mobile render
- [ ] **19.2** Run/Submit/reset via manager (after 19.1) — test: e2e run and submit
- [ ] **19.3** Attempt recording + offline queue (after 19.2) — test: PGlite + e2e idempotency/offline
- [ ] **19.4** Drafts (after 19.2) — test: reload restores code
- [ ] **19.5** Accessibility + Ctrl+Enter (after 19.2) — test: axe + keyboard e2e

### 20. Skill Library v1: register concepts right after learning them _(after 14, 18, 19)_
Priority **high** · complexity 5

Owner priority: register a concept the moment it is learned externally.

**How:** /skills: list with state; 'Add learned material' form (language, concept names, notes/source, difficulty, wanted count 5/10/20/30). Normalise case/punctuation/plurals + alias table seeded from the SQL foundation checklist (e.g. 'with clause'/'common table expression' → sql-cte); dedupe; new concepts start 'introduced'. Result page lists matching exercises first; if too few, shows 'import a pack' and 'copy AI prompt' (prompt text template, implemented fully in task 'author'). Simple practice launcher: choose concept(s), count, hints on/off → session of matching exercises.

**Acceptance: entering 'with clause, Left Join, cross joins, UNION, union all' yields 5 skills, no duplicates, linked to the 25 exercises; an unknown concept is created as introduced with zero exercises and clear next steps; e2e at 390px.**

### 21. Export/import includes practice data _(after 10, 14)_
Priority **high** · complexity 4

Data preservation applies to attempts from the first release.

**How:** Extend Export to {format:'pathway-export', version:2, workspace, skills, attempts, drafts, sessions}; import accepts v1 and v2 with dry run; attempts imported by id (idempotent).

**Acceptance: export → import into an empty owner reproduces everything; second import changes nothing; v1 files still import.**

### 22. Add Practice and Skills to the existing navigation _(after 9, 19)_
Priority **medium** · complexity 3

Integrate without redesigning the workspace.

**How:** Extract the sidebar into a shared component used by page.tsx and the new routes; add 'Practice' and 'Skills' entries with lucide icons; existing 8 views unchanged.

**Acceptance: regression suite and visual baselines unchanged for existing views (only the two new nav rows differ, baseline updated deliberately); new routes reachable at 1440 and 390.**

### 23. Release 1: usable SQL Practice Lab  [HUMAN approval] _(after 18, 19, 20, 21, 22)_
Priority **high** · complexity 2

Practice Lab gates 1 and 2 (MVP scope).

**How:** Backup, migrate, deploy, smoke on production.

**Acceptance: automated: correct/incorrect/equivalent queries, empty results, mutations, timeouts, production WASM, mobile, attempt idempotency, owner isolation; all 25 solutions verified; regression + visual suites green; playground suite green; owner can register WITH/LEFT JOIN/CROSS JOIN/UNION/UNION ALL and practise them on production.**


## Phase 3 — Expandable Skill Library (pack pipeline, authoring, modes) → Release 2

### 24. Pack import pipeline: stage, validate, verify, review, publish _(after 23)_
Priority **high** · complexity 9

New exercises without code changes, never trusted blindly.

**How:** Tables packs, pack_versions (status staged/validated/published/rejected, manifest, files jsonb ≤2 MB, report). Upload ZIP (fflate, path checks) or JSON; server + client validation; client worker runs each reference solution on each fixture and stores expected results; review screen; publish creates an immutable version; same exerciseId keeps identity; attempts keep their version. Bundled and imported packs appear in one registry.

**Acceptance: malformed JSON, ../ path, absolute path, oversized file, duplicate id, version downgrade, failing reference solution each rejected with an actionable message and retry; a valid pack is practisable immediately after publish; attempts recorded before a republish still show the original version.**
- [ ] **24.1** Upload + staging tables — test: staged row created
- [ ] **24.2** Validation server + client (after 24.1) — test: one test per rule
- [ ] **24.3** Reference-solution verification in worker (after 24.2) — test: wrong solution flagged; expected stored
- [ ] **24.4** Review + publish + versioning (after 24.3) — test: republish keeps ids, new version
- [ ] **24.5** Error/retry UX (after 24.4) — test: e2e fix and re-upload

### 25. Manual authoring and copyable AI generation prompt _(after 24)_
Priority **high** · complexity 4

Generate exercises with any AI chat or by hand.

**How:** Authoring form writes a staged pack (same pipeline). 'Copy AI prompt' embeds the pack schema, dataset schema, selected skills and rules (business purpose, fixtures, required constructs, synthetic data only). No server-side AI provider.

**Acceptance: authored exercise passes the pipeline and is practisable; prompt snapshot test contains schema and selected skills; a pack produced from the prompt by an AI chat imports successfully (manual check).**

### 26. Practice modes and session setup _(after 23)_
Priority **medium** · complexity 6

Mixed, debugging, predict-output, business challenge, free sandbox; 15/30/45/60 min.

**How:** Session setup adds difficulty, duration timer and mode; selection prefers unattempted then failed; predict-output (type expected output, then reveal); debugging from buggy starter; free sandbox with fixture picker and no grading; session summary.

**Acceptance: unit tests for selection; e2e per mode at 1440 and 390; timer ends session with summary; sandbox never records graded attempts.**

### 27. Release 2: expandable Skill Library _(after 24, 25, 26)_
Priority **high** · complexity 2

Practice Lab gate 3.

**Acceptance: register unknown concept → import/author pack → validate → publish → practise, with no code change; all rejection rules tested; ids and attempts preserved; suites green.**


## Phase 4 — Job application tracker → Release 3 (can ship any time after Release 1)

### 28. Job application tracker _(after 14)_
Priority **high** · complexity 5

Early, small deliverable; never locked behind readiness.

**How:** Tables job_applications, application_events. /jobs list + status board: title, company, URL, remote type, Canada eligibility, posted salary, requirements, fit notes/suitability, gaps, status (saved/applied/interviewing/offer/rejected/withdrawn/closed), applied date, follow-up date, source, external_ref; events timeline; follow-up due list; optional link to an existing role-target item (j1–j5). Existing visual style.

**Acceptance: e2e: add an application with no practice evidence; status change logs an event; follow-up due today is listed; 390px; owner isolation tested.**

### 29. Job import contract for the job-watch automation _(after 28)_
Priority **high** · complexity 4

CSV/JSON import now; automatable later without redesign (ADR-013).

**How:** Versioned contract pathway.jobs.v1 (JSON array or CSV with header mapping): required title, company, url; optional remote, canada_eligible, salary_text, requirements, suitability, posted_at, source, external_ref. Dry run → new / duplicate (canonical URL or source+external_ref) / invalid; apply is idempotent; imported rows start 'saved'. Spec published at docs/pathway-v2/job-import-contract.md with a ready-to-paste ChatGPT instruction so the daily automation outputs this format. Future: same handler behind a token-authenticated endpoint.

**Acceptance: sample JSON and CSV import; re-import creates no duplicates; invalid rows reported with line numbers; contract doc includes JSON schema and CSV columns.**

### 30. Release 3: job tracker live _(after 28, 29)_
Priority **high** · complexity 1

Can be released before Release 2 if wanted; depends only on Release 1 infrastructure.

**Acceptance: owner imports a real job-watch file and tracks an application on production; suites green.**


## Phase 5 — Mastery, review, assessments → Release 4

### 31. Mastery engine over recorded attempts _(after 27)_
Priority **high** · complexity 6

ADR-011; works retroactively on attempts stored since Release 1.

**How:** lib/domain/mastery.ts with injectable clock; recompute skills.state after each submit and once over history at release.

**Acceptance: 3 distinct independent passes → understood; same exercise 3× → not; hint/solution-assisted passes ignored; 2 mixed → proficient; 2 delayed ≥7 days → mastered; 6 days → not; historical attempts produce the expected states.**

### 32. Review queue (1/3/7/14/30) _(after 31)_
Priority **high** · complexity 5

Spaced repetition prioritising overdue and weak concepts.

**How:** review_queue table; lib/domain/review.ts; /practice/review mode.

**Acceptance: step changes on pass/assisted/fail unit-tested; queue order tested; e2e item due after clock advance.**

### 33. Assessments _(after 31)_
Priority **medium** · complexity 5

Independent evidence: timed, no hints or solutions.

**How:** assessments (content-defined), assessment_attempts; runner; SQL practice assessment (10 of the priority exercises).

**Acceptance: hint/solution controls absent; timeout ends attempt; result stored and visible on the skill pages; retakes stored separately.**

### 34. Release 4: mastery, review, assessments _(after 32, 33)_
Priority **high** · complexity 2

Practice Lab gate 4 (minus career links, which come in Phase 6).

**Acceptance: assisted, duplicate and delayed rules; cross-device persistence (two browser contexts); unauthorized/missing owner; export/import round-trip incl. reviews; suites green.**


## Phase 6 — Career layer expansion → Release 5

### 35. Additive workspace schema and idempotent content seeding _(after 23)_
Priority **medium** · complexity 6

Extend the existing JSON document instead of replacing it (ADR-005 v2).

**How:** Optional new item fields (provider, progressSource, skills[], milestones[], evidence[], impact[], publishable, simulated, roleTargetId) and kinds ('stage'); old documents stay valid. Seed by id only when missing: Stage 0 'now', 'ts-node', 'integration'; 14 curriculum courses; Learn SQL at 78% marked last-reported only if no item has the Learn SQL URL; role targets per master-plan table; 6 roadmap projects. Never modify an existing item; 'update available' suggestions for unedited seed items; 'suggested re-mapping' list (ADR-007).

**Acceptance: seeding twice adds nothing; edited items untouched; user Learn SQL value wins; c1–c6, p1–p5, f1–f3, j1–j5, o1–o3 unchanged; snapshot taken before first seed.**

### 36. Roadmap stages 0–6 and current-phase next action _(after 35, 34, 30)_
Priority **medium** · complexity 5

Stage cards with courses, skills, assessments, projects, evidence, job targets.

**How:** Existing Roadmap/Current phase views extended in place; lib/domain/nextAction.ts (overdue review > follow-up due > in-progress course > unmet exit criterion > next milestone); unmet exit criteria; Apply panel always visible.

**Acceptance: 7 stages in roadmap order + deferred section; exactly one next action; unit tests per branch; visual baselines updated deliberately.**

### 37. Library, projects and portfolio evidence _(after 35)_
Priority **medium** · complexity 6

Course provenance and skills; project milestones, evidence, honest impact; portfolio of publishable evidence.

**How:** Library: provenance badge, related skills, completion prompt (practise/assess/project). Projects: milestones with acceptance criteria, evidence types, impact measured vs estimate, simulated flag, limitations; RF scanner and batch shipping kept verbatim. Portfolio: publishable only + 10-point checklist + demo outline.

**Acceptance: course completion does not change skill state; impact cannot be saved without kind; unpublishable evidence never shown; existing portfolio items unchanged.**

### 38. Career checkpoints with evidence and gaps _(after 37, 36)_
Priority **medium** · complexity 4

Readiness explanations from skills, assessments and projects; never a gate.

**How:** lib/domain/readiness.ts; per-stage met/missing; suggested titles; link to jobs.

**Acceptance: unit tests; tracking an application is never disabled; titles match the master-plan table.**

### 39. Weekly plan v2 _(after 35, 34)_
Priority **medium** · complexity 5

Template from the schedule doc; sessions linked to course/practice/project; history preserved.

**How:** Template stored in the document with effectiveFrom; planned sessions per week; links; editable duration/done/notes/next action; launching practice from a session records minutes; Sunday review form (5 questions). Existing date sessions untouched.

**Acceptance: template change never alters past sessions; legacy sessions display unchanged; default week totals 15 h; practice session from Tuesday marks it done.**

### 40. Release 5: career layer expansion _(after 36, 37, 38, 39)_
Priority **medium** · complexity 2


**Acceptance: suites + visual baselines green; all prior records intact (export diff vs pre-release export shows only additions).**


## Phase 7 — 100 exercises, graduation, acceptance → Release 6

### 41. Expand to 100 SQL exercises through the pipeline _(after 27)_
Priority **medium** · complexity 8

Spec distribution, published as packs (no code changes).

**How:** filtering 8, manipulation 8, aggregates 10, INNER 8, LEFT 10, CROSS 8, UNION 8, CTE 10, mixed 15, assessment 15.

**Acceptance: content:verify passes all; category counts match; the original 25 ids unchanged.**

### 42. SQL graduation assessment and checklist _(after 41, 40)_
Priority **medium** · complexity 4

Stage 1 exit evidence.

**How:** Graduation assessment from the 15 assessment items; graduation checklist linked to skills, assessment and Distribution Operations Database evidence.

**Acceptance: passing marks the criterion met; remaining gaps (e.g. walkthrough video) shown honestly.**

### 43. Master-plan acceptance scenario _(after 42)_
Priority **high** · complexity 6

End-to-end proof.

**How:** e2e/acceptance.spec.ts: register WITH/LEFT JOIN/CROSS JOIN/UNION → import validated pack → practise, attempts recorded → skill/review update → assessment → link SQL project + portfolio evidence → job targets → track application → reload → persistence and older records verified. Preview automated; production manual.

**Acceptance: automated green on preview; owner signs off production checklist.**

### 44. Hardening, docs, release _(after 43)_
Priority **medium** · complexity 4


**How:** Code-split engine; axe all routes; README, runbook (backup/restore/rollback, rehearsed), COURSE-FORMAT addendum, CHANGELOG with actual results.

**Acceptance: all suites both repos green; restore rehearsed on a Neon branch; release approved.**


## Phase 8 — JavaScript / TypeScript / Node.js practice

### 45. JavaScript/TypeScript/Node practice sandbox ADR _(after 27)_
Priority **low** · complexity 4

Next roadmap stage; precedes Python.

**How:** Design: JS in a sandboxed iframe (no same-origin, per playground decision), TS compiled in the sandbox, Node-style exercises against simulated ERP/carrier APIs (no real network), evaluator for asserts/stdout, packs through the same pipeline.

**Acceptance: ADR approved by owner.**

### 46. JavaScript practice adapter and first JS pack _(after 45)_
Priority **low** · complexity 7


**How:** Implement per ADR (reuse playground task-50 design if built there); JS fundamentals pack aligned with courses/javascript.

**Acceptance: JS exercise runs isolated, times out, records attempts; pack verified.**


## Phase 9 — Python practice (deferred)

### 47. Python practice via existing Pyodide adapter (deferred) _(after 46)_
Priority **low** · complexity 5 · deferred

After JS/TS/Node and CAP.

**How:** Reuse vendored python adapter and evaluator.

**Acceptance (when scheduled): Python exercise runs, times out, records attempts.**
