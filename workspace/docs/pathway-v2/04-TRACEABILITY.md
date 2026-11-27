# Pathway v2 — Requirement traceability (revision 2)

Every requirement maps to UI, data, migration/seed, tests and tasks (`05-TASKS.md`). "Existing" means it already works on the Vercel branch.

## Owner adjustments (2026-11-25)

| Adjustment | Where | Tasks |
|---|---|---|
| Security, DB isolation, backups, data preservation first | Phase 1 / Release 0 | 2–12 |
| Usable SQL Practice Lab before the career-layer expansion | Release 1 before Release 5 | 13–23 |
| Spike moved earlier | Phase 1 | 4 |
| Skill Library prioritised; register concepts right after learning; packs without code changes | Skill Library v1 in Release 1; pipeline in Release 2 | 20, 24, 25 |
| Attempts recorded from the first Practice Lab release | Focus view + attempts table | 14, 19, 21 |
| Priorities WITH/CTE, LEFT JOIN, CROSS JOIN, UNION, UNION ALL | Priority pack, aliases | 18, 20 |
| Job tracker early, not delaying practice | Release 3, depends only on task 14 | 28–30 |
| JS/TS/Node practice before Python | Phases 8 → 9 | 45–47 |
| Preserve workspace functionality, visual design, course progress, portfolio | Regression + visual baselines; additive model | 9, 22, 35, 40 |
| No unnecessary complexity; incremental releases | ADR-005 revised; release per phase | all |
| Vercel Authentication only, explicit owner ID, verify production/previews/API, stop if not possible | ADR-002/003 | 6, 7, 11 |
| job-watch: CSV/JSON + manual now, automatable later | ADR-013 | 29 |
| Merge playground phase-6 when criteria and tests pass | Phase 1 | 5 |

## MASTER-PLAN.md

| Requirement | UI | Data | Migration / seed | Tests | Tasks |
|---|---|---|---|---|---|
| Stages 0–6 with courses, mastery, assessments, projects, evidence, job targets | Roadmap (existing, extended) | document `stage` items | additive seed | e2e order | 35, 36 |
| Order SQL→JS→TS→Node→CAP→Integration/Build→Python; deferrals | Roadmap + deferred section | stage order | seed | e2e | 35, 36 |
| Current phase: one next action, unmet exit criteria | Current phase (existing, extended) | document + practice tables | — | unit nextAction | 36 |
| Course completion ≠ mastery; prompts practice/assessment/project | Library prompt | document vs `skills` | — | unit | 37 |
| Applications from stage 0; fit and gaps; never locked | Jobs page; Apply panel | `job_applications` | — | e2e with no evidence | 28, 36, 38 |
| Job tracker fields; no fabricated listings; manual; link job-watch; no auto-apply | Jobs form, import | `job_applications`, `application_events` | — | import idempotency/dedupe | 28, 29 |
| Library: URL, status, progress, notes, certificate, phase, skills | Library (existing, extended) | document fields | additive | e2e | 35, 37 |
| Learn SQL 78% only without a newer user value | Provenance badge | `progressSource` | seed rule | unit | 35 |
| Skill Library registers concepts; generates/imports packs | /skills, pack import | `skills`, `packs` | aliases from content | e2e, pipeline tests | 20, 24, 25 |
| Practice Lab reuses playground engine | /practice | — | vendored snapshot | integrity, gate e2e | 4, 13, 19 |
| Assessments track independent evidence | Assessment runner | `assessment_attempts` | content | e2e | 33, 42 |
| Weekly plan links; editable; default schedule; history preserved | Weekly plan (existing, extended) | document template + sessions | additive | unit forward-only | 39 |
| Projects: milestones, criteria, tests, repo, screenshots, architecture, demo, limitations, measured vs estimated | Projects (existing, extended) | document fields | additive; RF/batch kept | unit | 37 |
| Portfolio aggregates publishable evidence; no employer data | Portfolio (existing, extended) | `publishable` | — | unit | 37 |
| Checkpoints: evidence, gaps, titles | Checkpoints (existing, extended) | derived | — | unit | 38 |
| Stable IDs, explicit relationships, defaults separate from progress | — | tables + document ids | `content/` | PGlite | 14, 24, 35 |
| Idempotent seeding; never reset progress/notes/user items | — | — | ADR-008 | unit | 35 |
| Preserve existing features and records | All existing views | snapshots | reconciliation import | regression + visual | 9, 10, 22, 40 |
| Authenticated persistence, export/import, revisions/conflicts | Settings import/export | `rev`, idempotent inserts | — | 409/idempotency/import | 6, 10, 14, 21 |
| Verify Vercel/Neon/auth; no secrets or employer data | — | — | backups | protection checks | 2, 3, 6, 7 |
| Readiness gates per stage | Checkpoints | — | seed criteria | unit | 38 |
| Engineering standards for projects | Project checklist | document fields | — | unit | 37 |
| Acceptance demo end to end | — | — | — | `e2e/acceptance.spec.ts` | 43 |
| Mobile, accessibility, worker isolation, auth, export/import, regression | All | — | — | axe, 390 px, worker tests | 9, 19, 23, 34, 44 |

## Practice Lab spec

| Requirement | Tasks |
|---|---|
| Audit, SHAs, baseline tests, ADRs, PRD, task plan, approval | 01-AUDIT.md, 1 |
| Modes: targeted, mixed, debugging, predict-output, business, sandbox, assessments | 20 (targeted), 26, 33 |
| Concepts, difficulty, 15/30/45/60 min, count, hints | 20 (concept/count/hints), 26 |
| Focus view; Run free / Submit records; Reset sandbox ≠ draft | 19 |
| Learned-material form; 5/10/20/30; aliases; dedupe; introduced; existing first | 20 |
| Manual authoring, pack import, copyable AI prompt; no provider without approval | 24, 25 |
| Stage → validate → verify on varied fixtures → review → publish | 16 (bundled), 24 |
| New concepts without code changes; versions; stable IDs; historical attempts | 24 |
| Reuse editor, terminal, manager, worker, evaluator, viewer, course system, storage | 4, 13 |
| Backward-compatible concept tags, difficulty, prerequisites, versions | 16 |
| Versioned shared modules or pinned snapshot with update procedure | 13 |
| Adapt Vite workers/WASM to Pathway | 4, 13 |
| SQLite labelled; no PGlite for learners | 19 |
| Client-only sandbox, timeouts, terminate, caps, reset; never the workspace DB | 4, 15, 19 |
| Cloud persistence: skills, user_skills, exercise_versions, attempts, sessions, saved_code, review_queue | 14, 24, 32 |
| User scope, validation, idempotency, conflicts, offline drafts, export/import; no client identity | 6, 14, 19, 21 |
| Mastery states and rules; assisted/repeat excluded | 31 |
| Review 1/3/7/14/30; shorten on failure/assist; overdue/weak first | 32 |
| Connect practice to weekly plan, assessments, checkpoints | 36, 38, 39 |
| Synthetic distributor dataset with edge cases; deterministic fixtures | 17 |
| MVP 25 exercises | 18 |
| Expand to 100 by category | 41 |
| Equivalent results; construct check; varied fixtures | 15 |
| Preserve RF scanner and batch shipping; add roadmap projects | 35, 37 |
| Gates, feature branches, tests, changelog, preview first, backup and rollback | release tasks 11, 23, 27, 30, 34, 40, 44 |

## ADAPTIVE-LEARNING.md (approved amendment, 2026-11-26; ADR-016 numbers pending task 49)

| Requirement | Where it fits | Tasks |
|---|---|---|
| Shared evidence across Learn, Practice, Skill Library; sandbox is not evidence | Graded modes only; course completion stays separate | 26, 31, 37 |
| Configurable proficiency threshold, default 80% inclusive; reinforcement bands | `learning_settings`; proficiency module; recommender | 31, 49, 50, 51 |
| Concept-level evidence; aggregate by module, course, language | Concept → module → language (Release 4); course (Release 5) | 31, 37 |
| Insufficient evidence ≠ low proficiency ≠ mastery | Separate verdict in proficiency | 31, 51 |
| Recurring errors, independent first attempts, hints, solution views, exercise versions | Derived from stored attempts | 31 |
| Repeated identical exercises do not inflate mastery | Unit-tested distinct and independent rules | 31 |
| Scoring formula, minimum evidence, delayed retention proposed and approved | ADR-016 | 49 |
| Review 1/3/7/14/30, extend on retention, shorten on weakness | Adaptive review queue | 32 |
| Daily queue: time budget, weak/overdue first, unfamiliar preferred, mixed practice | Shared selector plus recommender | 26, 50 |
| New learning alongside reinforcement, no gates | Balance setting; ADR-012 | 39, 50, 51 |
| Content gap → import/generation suggestion | Gap result opens pack import or AI prompt | 24, 25, 50 |
| Weekly assessment and retention checks influence next week | Assessment kinds; weekly plan v2 | 33, 39 |
| Dashboard and settings | /practice/progress, GET/PUT /api/v2/settings | 51 |
| Integrate daily queue into weekly study schedule | Weekly plan v2 | 39 |
| Same rules for every language adapter; existing data intact | Pure language-neutral modules; no migration of old attempts | 31, 50 |
| Automated tests: thresholds, duplicates, assisted, review dates, settings, content gaps, persistence | Named tests per task; gate 34 | 31, 32, 34, 50, 51 |

## Learn and curriculum (approved amendment, 2026-11-27)

| Requirement | Where it fits | Tasks |
|---|---|---|
| Dedicated Learn section | /learn routes, navigation entry | 53 |
| Curriculum by language, course, module, lesson, concept; data-driven | Pack manifests + registry; ADR-017 | 24, 52 |
| Lesson viewer: explanations, syntax, runnable examples, guided and independent exercises | Viewer on adapter registry and focus view | 53 |
| Complete course, module and lesson imports | Lesson-aware pack pipeline; course prompt | 24, 25 |
| Lesson completion and progression | `lesson_progress`, next lesson | 52, 51 |
| Link external courses to in-app lessons | `curriculumCourseId` on library items | 35, 37 |
| Lessons searchable and usable as AI context | Shared search with materials | 48, 25 |
| Lessons support adaptive reinforcement | Revisit-lesson recommendation, lesson gap | 50 |
| Expandable without code changes; any language | Content only; adapter registry | 24, 52, 53 |
