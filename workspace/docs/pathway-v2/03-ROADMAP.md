# Pathway v2 — Phased roadmap (revision 2)

No dates: order and gates matter. Each phase runs on a feature branch with small commits, a Vercel preview on the **isolated preview** Neon branch, and a gate running the full suite for both apps. Every phase ends in a production release, and nothing reaches production without owner approval. Task numbers refer to `05-TASKS.md`.

| Phase → Release | What you can use afterwards | Gate | Tasks |
|---|---|---|---|
| 0 Approval | — | Revision 2 approved | 1 |
| 1 → **Release 0** Platform safety | Production live on Vercel/Neon, protected, backed up, data reconciled | Both data sources backed up; previews isolated; protection verified (stop condition); spike passed; phase-6 merged; regression + visual baselines green | 2–12 |
| 2 → **Release 1** SQL Practice Lab | Register WITH/CTE, LEFT JOIN, CROSS JOIN, UNION, UNION ALL; practise 25 verified ERP exercises; every Submit recorded | Practice Lab gates 1–2 (MVP scope); idempotent attempts; export includes attempts | 13–23 |
| 3 → **Release 2** Expandable Skill Library | Import/author/AI-generate packs for any concept and language without code change; learning material library as generation context; more practice modes | Practice Lab gate 3 | 24–27, 48 |
| 4 → **Release 3** Job tracker | Track applications; import job-watch CSV/JSON | Idempotent import, dedupe, contract documented | 28–30 |
| 5 → **Release 4** Mastery, review & adaptive practice | Mastery and proficiency (computed over all attempts since Release 1), adaptive review queue, assessments, daily recommended practice, dashboard and settings | Practice Lab gate 4 (minus career links) + ADAPTIVE-LEARNING.md acceptance criteria | 31–34, 49–51 |
| 6 → **Release 5** Career layer | Stages 0–6, curriculum, project evidence, portfolio, checkpoints, weekly plan v2 | Prior records unchanged (export diff = additions only) | 35–40 |
| 7 → **Release 6** Acceptance | 100 exercises, SQL graduation assessment | Master-plan acceptance scenario | 41–44 |
| 8 JS/TS/Node practice | JavaScript adapter and first pack — **starts when JS study begins, any time after Release 1** | ADR approved; isolated execution tested | 45–46 |
| 9 Python practice | Deferred | — | 47 |

## Multi-language vision (2026-11-26)
The Practice Lab is a permanent multi-language academy. Release 1 builds SQL content only, but on language-neutral foundations (adapter registry, `language` everywhere, language-declared packs). Languages are added alongside the owner's learning: the JS/TS/Node adapter (tasks 45–46) can start as soon as JS study begins, in parallel with Releases 2–6.

## Adaptive learning amendment (2026-11-26, approved by owner; ADR-016 numbers pending task 49 approval)
`ADAPTIVE-LEARNING.md` fits the existing releases; nothing is re-ordered.
- **Release 2:** small foundations only: `estimatedMinutes` in packs (24), gap-aware AI prompt (25), one pure shared exercise selector (26). Task 49 (ADR-016 scoring and scheduling proposal) can be done during Release 2 so approval is ready before Release 4 starts.
- **Release 4:** proficiency and evidence rules (31), adaptive intervals (32), retention and weekly assessments (33), daily recommendation engine (50), dashboard and settings (51).
- **Release 5:** course aggregation (37), next action and readiness (36, 38), daily queue and weekly assessment in the weekly plan (39), graduation threshold (42), acceptance scenario (43).
- **Why not earlier:** mastery needs stable pack versions (Release 2) and attempts already hold everything required, so no earlier migration is needed.

## What changed from revision 1

- **Spike moved into Phase 1** (task 4) so integration blockers surface before any feature work.
- **Practice Lab comes right after platform safety** (Release 1) instead of after the full career layer.
- **Skill Library split into v1 (Release 1) and the pack pipeline (Release 2).** You can register concepts from the first practice release.
- **Attempts are recorded from Release 1.** Mastery (Release 4) is computed retroactively over them, so no evidence is lost.
- **The job tracker is its own small release.** It depends only on Release 1 infrastructure (task 14), so it can ship before Release 2 at any point without changing any other dependency.
- **Less infrastructure.** Revision 1's full relational migration and the page.tsx route split are dropped. The existing workspace document and UI stay. New features get only the tables they need. The career layer extends the document additively.
- **JS/TS/Node practice comes before Python.**

## Why this order

1. **Safety first.** Today previews write to the production database, production isn't live, and Sites data may exist only in D1.
2. **Spike before investment.** Workers + WASM + React 19 in Next 16 is the main unknown.
3. **Practice is the daily-use feature.** It targets exactly what you are studying now.
4. **Expandability next.** Once the format is proven with 25 hand-verified exercises, the pipeline lets content grow without code.
5. **Job tracker early but small.** It's a few sessions of work with no practice dependency.
6. **Mastery after content is stable.** Pack versioning (Release 2) makes attempt history reliable.
7. **Career expansion last among features.** It consumes evidence from all earlier releases.

## Per-phase procedure

1. Branch `feat/v2-pN-<name>` from main; first task logs its plan.
2. Small commits referencing task IDs (`task 19.3: attempt offline queue`).
3. CI on each push: lint, typecheck, unit, integration (PGlite), content verify, build, Playwright (incl. visual baselines) on the preview.
4. Gate: full suites for workspace and playground; actual results in `CHANGELOG.md`.
5. Production: owner approval → Neon backup branch + owner export → additive migration → merge → smoke test → previous deployment kept as rollback target.

## Deployment considerations

- **Protection:** Vercel Authentication with `deploymentType: all` is already set. Previews were verified on 2026-11-25 (an unauthenticated API request returns a 302 redirect to Vercel login). The production domain is verified at the first production deploy, made with `OWNER_ID` unset so the API can only answer 503. If it isn't protected under the current plan, stop and discuss.
- **Environments:** production (main → Neon main), preview (branches → Neon `preview`), local (PGlite or a dev branch). `/api/health` reports which.
- **Migrations:** additive only through Release 6, applied explicitly (never at build), preview first.
- **Rollback:** Vercel rollback (Hobby allows rolling back to the immediately previous production deployment), Neon backup-branch restore, `workspace_snapshots`, and your JSON exports.
- **CI on protected previews:** a Vercel protection-bypass secret kept in GitHub Actions secrets.
- **Cost:** Neon free tier and the current Vercel plan are expected to suffice. Practice runs in the browser. No paid AI API.
