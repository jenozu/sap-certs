# Pathway Practice Lab — Claude Code handoff

Integrate jenozu/playground into jenozu/sap-certs/workspace. Preserve both apps and existing user data. Audit both repositories and deployment branches, record source SHAs, run baseline tests, propose architecture and task plan, then stop for owner approval before coding.

## Product requirements
Add Practice Lab, Skill Library and Assessments to Pathway. Support targeted and mixed practice, debugging, predict-output, business challenges, free sandbox and assessments. Select concepts, difficulty, duration (15/30/45/60 minutes), exercise count and hints. One exercise in focus with instructions, schema, CodeMirror editor, output, hints and solution. Run executes freely; Submit validates and records attempts. Reset sandbox separately from drafts.

## Continuously expanding learning library — priority
Add learned material form: language, concept names, optional notes/source, difficulty and 5/10/20/30 exercises. Normalize aliases and deduplicate. Mark introduced, not mastered. Search existing exercises first. Allow manual authoring and generated course pack import, with copyable AI generation prompt; optional server-side AI provider only after approval, no paid API required. Stage packs, validate schema, paths, IDs and size, execute reference solutions against varied fixtures, verify expected results, review and publish. New concepts and exercises must become available without code changes. Preserve versions, stable IDs and historical attempts. Provide actionable errors and retry. Never expose keys or trust generated content.

## Architecture
Reuse playground editor, terminal, execution manager, sql.js worker, SQL evaluator, lesson viewer, course-system and storage interfaces. Inspect COURSE-FORMAT.md and existing course packs. Practice and Progress pages were placeholders at prior audit. Preserve Run/Submit, JSON/Markdown manifest, starter/tests/solution/dataset format; propose backward-compatible concept tags, difficulty, prerequisites and versions. Extract versioned shared modules or pinned vendored snapshot with update procedure. Adapt Vite workers/WASM to actual Pathway framework. Label SQLite dialect; no PGlite unless justified. Client-only sandbox, timeouts, worker termination, output limits and reset. Never run learner SQL against production workspace DB.
Verify current Vercel/Neon/auth migration; prior main used D1/Sites identity and revision checks. Preserve existing records. Browser sandbox for execution; authenticated cloud persistence for skills, user_skills, exercise_versions, exercise_attempts, practice_sessions, saved_code and review_queue. User scope, validated payloads, idempotency, conflicts, offline drafts, export/import. No arbitrary client identity headers or secrets.

## Mastery and review
Track introduced, practising, understood, proficient, mastered independently of course completion. Record code, results, hints/solutions, timestamps, duration and exercise version. Proposed rules: 3 distinct independent passes for understood, 2 mixed independent passes for proficient, 2 delayed independent passes at least 7 days apart for mastered. Assisted attempts and repeated exercises cannot inflate mastery. Review intervals 1/3/7/14/30 days, shorten after failure or assistance. Prioritize overdue and weak concepts. Connect practice to weekly plan, assessments and career checkpoints.

## Curriculum
Synthetic distributor dataset: suppliers, customers, products, warehouses, purchase orders/lines, receipts/lines, invoices/lines, sales orders/lines, shipments and inventory movements. Include unmatched rows, duplicate cities, partial receipts, nulls, multiple branches and discrepancies. Deterministic resettable fixtures. MVP 25 exercises: 5 each LEFT JOIN (missing orders, unsold products), CROSS JOIN (warehouse/product matrix), UNION/UNION ALL (branch shipments), WITH/CTE (supplier spend, outstanding receipts), plus 5 mixed challenges. Expand to 100: filtering 8, manipulation 8, aggregates 10, INNER JOIN 8, LEFT JOIN 10, CROSS JOIN 8, UNION 8, CTE 10, mixed 15, assessment 15. Each has business purpose, starter, hints, tests and verified solution. Accept equivalent results; check required construct separately. Use varied fixtures to detect hardcoded answers.

## Roadmap
Intro SQL complete; Learn SQL last reported 78%, studying WITH, LEFT JOIN, CROSS JOIN, UNION. PostgreSQL database design next; Distribution Operations Database graduation project with schema, seed, queries, ER diagram, tests, README, screenshots and walkthrough. SQL -> JS -> TS -> Node -> CAP -> Integration Suite/SAP Build -> Python. BTP administration deferred. Preserve RF scanner and batch shipping projects; add inventory lookup, shipping automation, procurement comparator, direct-ship and AI invoice projects. Encourage early remote ERP applications.

## Implementation gates
0. Audit both repos, deployment, auth and database; propose ADRs, PRD and detailed task plan; obtain approval.
1. Integrate editor/worker/evaluator, Run/Submit/reset, hints, drafts and course packs. Test correct/incorrect/equivalent queries, empty results, mutations, timeouts, production WASM and mobile.
2. ERP dataset and 25+ priority exercises; validate all reference solutions and concept selection.
3. Expandable library: register unknown concept, import/edit/stage/validate/publish packs, reject malformed/path traversal/oversized content, preserve attempts and IDs.
4. Cloud progress, mastery, review, assessments and weekly plan. Test assisted attempts, duplicates, delayed review, cross-device persistence, unauthorized access, migration and export/import.
5. Expand to 100 exercises and graduation assessment; future languages in roadmap order. Reuse Python adapter later; JS/TS/Node need separate sandbox design.
Each phase: feature branch, small commits, unit/integration/e2e tests, lint/typecheck/build, regression checks for both apps, changelog and actual test results. Preview before production, backup and rollback plan. No production changes without approval. Synthetic data only.
