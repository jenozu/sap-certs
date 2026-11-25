# Pathway v2 — PRD (revision 2)

Status: **revision 2, awaiting owner approval** (2026-11-25). Revision 1 was broadly approved with adjustments; this revision applies them (see decision log). Sources of truth: `workspace/docs/MASTER-PLAN.md`, `workspace/docs/practice-lab/README.md` and the documents they link. If this PRD and those documents disagree, the source documents win and this PRD gets a decision-log entry.

## Goal

Make Pathway a private, deployed workspace where Andel can (1) practise the SQL concepts he is learning right now — WITH/CTE, LEFT JOIN, CROSS JOIN, UNION and UNION ALL — against a synthetic distributor database, with every attempt recorded; (2) register a concept the moment he learns it elsewhere and add practice for it without code changes; (3) track job applications, including results from his daily job-watch automation; and (4) grow into the full career roadmap (stages 0–6, mastery, assessments, projects, portfolio, checkpoints). Every release must keep all existing workspace functionality, visual design, course progress and portfolio records. Done means the master-plan acceptance scenario passes on production.

## Principles (owner adjustments)

1. Platform security, database isolation, backups and data preservation come first.
2. Ship working increments; each phase ends in a usable production release.
3. Prove the playground integration early (spike in Phase 1).
4. Avoid unnecessary infrastructure: extend the existing workspace document where it suffices; add relational tables only for high-volume or relational data (attempts, drafts, skills, packs, applications, reviews).
5. GitHub is the single source of truth for plans and content.

## Non-goals

- Rebuilding the playground or the existing workspace UI; no redesign.
- A big-bang relational migration of the existing workspace document.
- GitHub sign-in or any second auth system; client-supplied identity headers.
- Automatic job applications, scraping job boards, invented listings. (A token-authenticated import endpoint for the job-watch automation is a later option, not v2 scope.)
- Running learner code on a server or against Neon. PostgreSQL-dialect learner practice (PGlite).
- Paid AI APIs or a server-side AI provider (copyable prompt only).
- Python practice before JavaScript/TypeScript/Node practice.
- Multi-user accounts; employer data anywhere; fixed dates; locking applications behind readiness.

## Releases and success criteria

| Release | You can… | Success criteria |
|---|---|---|
| **0 — Platform safety** | Use production on Vercel/Neon safely | Sites and Neon data verified and backed up; previews use a separate DB; Vercel Authentication verified on production domain, previews and every API route; explicit `OWNER_ID`, fail-closed; reconciled data intact; regression + visual baselines green; spike passed |
| **1 — SQL Practice Lab** | Register WITH/LEFT JOIN/CROSS JOIN/UNION/UNION ALL and practise 25 verified ERP exercises | Run/Submit/reset/hints/solution/drafts work on desktop and phone; **every Submit stored** with version, hints/solution usage and independence flag; equivalent answers accepted, hard-coded answers fail; export includes attempts |
| **2 — Expandable Skill Library** | Import or author new exercise packs (incl. AI-generated) for any registered concept, no code change | Pipeline rejects malformed/unsafe/unverified packs with actionable errors; published versions immutable; attempts keep their version; more practice modes |
| **3 — Job tracker** | Track applications and import job-watch results (CSV/JSON) | Manual entry, statuses, events, follow-ups; idempotent import with duplicate detection; documented `pathway.jobs.v1` contract ready for later automation |
| **4 — Mastery & review** | See mastery states, a review queue and take assessments | Rules applied retroactively to attempts recorded since Release 1; assisted/repeated attempts do not inflate mastery |
| **5 — Career layer** | See stages 0–6, curriculum, project evidence, portfolio, checkpoints, weekly plan v2 | All prior records unchanged; seeding idempotent; Learn SQL 78% only as last-reported seed |
| **6 — Acceptance** | 100 exercises and the SQL graduation assessment | Master-plan acceptance scenario passes on preview (automated) and production (signed off) |

Release 3 depends only on Release 1 infrastructure and can ship before Release 2 if wanted. Phase 8 (JS/TS/Node practice) follows; Python is deferred after it.

## Capabilities

### C1 Platform and data safety (Release 0)
Backups of both data sources; preview/production DB isolation; Vercel Authentication verification with a stop-and-discuss condition; server-side owner identity; request hardening; snapshots and validated import to reconcile Sites/Neon data; test harness, regression and visual baselines; playground compatibility spike; playground phase-6 merged under its own criteria.

### C2 Practice Lab (Release 1, expanded in 2)
Focus view: instructions, schema browser, CodeMirror editor, output, progressive hints, solution, Run (free), Submit (validate + record), Reset sandbox (separate from draft), Restore starter. Cloud drafts with offline queue. SQLite dialect labelled. Evaluator: varied fixtures, equivalent results, required-construct check, output caps, timeouts. Release 2 adds mixed, debugging, predict-output, business, sandbox modes and 15/30/45/60-minute sessions.

### C3 Skill Library (v1 in Release 1, pipeline in Release 2)
v1: "Add learned material" (language, concepts, notes/source, difficulty, 5/10/20/30), alias normalisation, dedupe, new concepts `introduced`, existing exercises shown first, launch practice by concept. v2: stage → validate → verify reference solutions on fixtures → review → publish; manual authoring; copyable AI prompt; versioning with stable IDs.

### C4 Attempts and evidence (from Release 1)
Insert-only, idempotent attempt records: code, results, pass, construct check, hints used, solution viewed, independent flag, exercise version and hash, timestamps, duration, session. Included in export/import.

### C5 Job tracker (Release 3)
Fields per master plan (title, company, URL, remote, Canada eligibility, posted salary, requirements, suitability/fit notes, gaps, status, dates, follow-up, source, external reference); events; follow-up list; `pathway.jobs.v1` import (JSON/CSV, dry run, dedupe, idempotent) designed so the daily ChatGPT job-watch can later post the same payload automatically.

### C6 Mastery, review, assessments (Release 4)
States introduced → practising → understood → proficient → mastered; rules from the Practice Lab spec; review 1/3/7/14/30 days; timed assessments without hints.

### C7 Career layer (Release 5)
Additive extension of the workspace document: stages 0–6 with exit criteria, curriculum (14 courses), Learn SQL last-reported 78% seed rule, role targets per stage, 6 roadmap projects with milestones/evidence/impact (measured vs estimate), portfolio of publishable evidence, readiness checkpoints (never a gate), weekly plan v2 (template from the schedule doc, linked sessions, forward-only template changes, Sunday review).

### C8 Later languages
JS/TS/Node practice sandbox (Phase 8) before Python (Phase 9, deferred).

## Structure

```
workspace/
  app/page.tsx                 existing 8 views (kept; sidebar extracted for reuse)
  app/practice/  app/skills/   Release 1–2      app/jobs/  Release 3
  app/api/workspace/           existing document API (+ import, snapshots)
  app/api/v2/                  practice, skills, packs, attempts, jobs (owner-scoped)
  db/postgres/                 existing workspaces + additive tables
  content/                     packs (datasets, exercises), skill aliases, career seeds
  lib/practice/                evaluator extensions, pack validator, practice client
  lib/domain/                  mastery, review, readiness, nextAction (later releases)
  lib/server/                  owner resolution, request guard, repositories
  vendor/playground/           pinned engine snapshot + UPSTREAM.json
```

## Dependency order

Platform safety → (spike, vendored engine, practice tables) → evaluator → pack format → dataset → priority exercises → focus view with attempts → Skill Library v1 → Release 1 → pack pipeline / modes → Release 2. Job tracker needs only the practice-table API from Phase 2. Mastery needs Release 2 (stable pack versions). Career expansion needs Releases 3 and 4 for automatic evidence. 100 exercises need the pipeline.

## Test strategy

Unit (Vitest): evaluator, validator, normalisation, mastery/review/readiness, import parsers, seeding. Integration (Vitest + PGlite running real Drizzle migrations): owner isolation, revisions, idempotency, imports. E2E (Playwright, 1440 px and 390 px): regression + visual screenshots of existing views from Phase 1 onward, practice flows, acceptance scenario; axe accessibility. Content: `npm run content:verify` runs every reference solution on every fixture. Every release: lint, typecheck, unit, integration, content verify, e2e, build for the workspace; the playground suite stays green.

## Architecture and stack

Next.js 16 App Router on Vercel, Neon Postgres via Drizzle, Vercel Authentication (all deployments) + server-side `OWNER_ID`. Practice engine vendored from the playground (CodeMirror 6, sql.js in a Web Worker). Rejected: GitHub sign-in (owner decision); full relational rewrite of the workspace document (unnecessary risk); iframe-embedding the playground; PGlite for learners. Details: `docs/pathway-v2/02-ARCHITECTURE.md`.

## Risks and open questions

- Vercel plan may not protect the permanent production domain under "all deployments": verified at the first production deploy with `OWNER_ID` unset (no data can be served); stop and discuss if unprotected.
- Sites and Neon copies may both contain unique edits: per-item reconciliation chosen by the owner, snapshots kept.
- Engine in Next 16/React 19: spike in Phase 1; stop if no fallback.
- Exercise content quality and volume: verification pipeline; owner review of samples.

## Decision log

- 2026-11-25: Build on `feat/workspace-vercel-migration` (Vercel/Neon). (all)
- 2026-11-25: Mastery thresholds as proposed in the Practice Lab spec. (Phase 5)
- 2026-11-25 (owner): Both Sites and Neon may hold data — verify and back up both before changes. (tasks 2, 10)
- 2026-11-25 (owner): Vercel Authentication is the sole auth with an explicit server-side owner ID; no GitHub sign-in; stop and discuss if the plan cannot protect production domain, previews and APIs. (tasks 6, 7)
- 2026-11-25 (owner): job-watch is a daily ChatGPT automation; CSV/JSON import + manual entry now; import contract designed for later automation. (tasks 28, 29)
- 2026-11-25 (owner): Merge playground phase-6 if its acceptance criteria and tests pass after review. (task 5)
- 2026-11-25 (owner): Commit planning docs to `docs/pathway-v2-plan` in jenozu/sap-certs; GitHub is the single source of truth.
- 2026-11-25 (owner): Re-ordered: platform safety → usable SQL Practice Lab (with attempts recorded from day one) → expandable Skill Library → job tracker (early, not blocking practice) → mastery → career layer; spike moved into Phase 1; JS/TS/Node before Python; minimal infrastructure. Consequence: revision 1's full relational migration and page.tsx route split are dropped in favour of additive tables and an additive document schema. (supersedes revision 1 tasks 8–13)
