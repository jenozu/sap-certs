# Pathway v2 — implementation checklist

Living status file. Update it at every task change. Source of truth for tasks: `.taskmaster/tasks/tasks.json` (rendered in `05-TASKS.md`).

_Last updated: 2026-11-27 09:35 (America/Toronto)_

## Standing conditions (owner, 2026-11-25)
- Stop for approval before: any production database migration, any destructive operation, any production release.
- Vercel Authentication is the only auth; every production and preview route must be protected.
- Production and preview databases stay isolated.
- Preserve all existing functionality, design and saved data.
- Owner actions are given one at a time, with URLs, clicks, values and how to verify.

## Current
- **Release 1 LIVE (2026-11-26 12:55).** Owner hands-on test in progress (A17); Part 1 not yet saved on production (read-only Neon check). Release 2 starts after the owner confirms.
- Owner merges in progress: PR #2 (plan docs), playground PR #6.

## Completed
| Task | Date | Commit | Notes |
|---|---|---|---|
| 0 Audit + plan rev. 1 | 2026-11-25 | — | Baselines recorded in 01-AUDIT.md |
| 1 Approval of revision 2 | 2026-11-25 | cf65201 | Approved 13:30 |
| 23 Release 1 | 2026-11-26 | PR #3 → main 2cbe6ef | Backup `backup-pre-release1`; prod migration 0002 (skills, practice_sessions, exercise_attempts, saved_code); probe 18/18 prod URLs protected; smoke OK; vendored engine 8/8 files identical to playground eebbfc3 |
| 21 Export/import v2 with practice data | 2026-11-26 | 061b92d | Idempotent; v1 files still import; 4 MB cap |
| 19, 20, 22 Focus view, Skill library v1, nav | 2026-11-26 | 2c5cc34 | Attempts from day one (assisted flag, offline queue), any-language concepts, design tokens reused |
| 15–18 Evaluator, pack format, dataset, 25 exercises | 2026-11-26 | 8d5c962 | 3 fixtures; content:verify proves starters and hard-coded answers fail |
| 14 Practice tables + API | 2026-11-26 | 51d0df0 | Additive 0002 applied to **preview** DB only |
| 13 Vendored engine + adapter registry | 2026-11-26 | 9987cf2 | Playground pinned eebbfc3 (playground PR #6) |
| Plan 2.1 multi-language vision | 2026-11-26 | 5d10b5e | ADR-014/015, task 48 |
| 11 Release 0 | 2026-11-26 | PR #1 → main f75c153 | Backup `backup-pre-release0`; prod `workspace_snapshots` created; first deploy fail-closed (503) + probe: 10 prod URLs 302→Vercel login; then OWNER_ID=owner:andel; prod `/api/health` ok |
| 7 Protection verification | 2026-11-26 | probe workflow | 8 preview + 10 production URLs protected (GitHub Actions, no credentials) |
| 5 Merge playground phase-6 | 2026-11-25 | playground 4d5f263 (PR #5) | Gate: lint, tsc, vitest 106/106, build, Playwright 26/26; review clean |
| 10 Snapshots + validated import | 2026-11-25 | 9ea12f3 | Additive `workspace_snapshots`; dry-run preview; never deletes; applied to **preview** DB only |
| 9 Regression + visual baseline | 2026-11-25 | 1991894 | 8 views × desktop/mobile; 16 screenshots (VISUAL=1); axe baseline |
| 8 Test harness + CI | 2026-11-25 | 1991894, 54f4256 | Vitest+PGlite, Playwright, GitHub Actions green |
| 6 Owner identity + hardening | 2026-11-25 | 368bafb, dd6b7d2 | OWNER_ID fail-closed, guard, next-auth + AUTH_* vars removed, route tests |
| 4 Compatibility spike | 2026-11-25 | dced9df | Engine works in Next 16/React 19 prod build, CSP, timeout recovery, mobile. One shim (Vite worker ref) until upstream PR |
| 3 Isolate preview DB | 2026-11-25 | 368bafb | Neon `preview` branch; Vercel DATABASE_URL split Production/Preview (verified via API); DB_ENV + preview OWNER_ID set; preview `/api/health` → dbEnv=preview |
| 2 Verify and back up data | 2026-11-25 | this commit | Neon backup branch `backup-pre-v2` (br-ancient-heart-bdf2u1lx); Neon `workspaces` has **0 rows**; Sites not exportable (limitation) |

## Upcoming
- **Proposed amendment (awaiting owner approval, A21):** Learn section and curriculum foundations in Release 2: new tasks 52–53, expanded 24, 25, 27, 35, 37, 48, 50, 51, ADR-017. Branch `docs/learn-curriculum-plan`. Docs only.
- **Adaptive-learning amendment approved (A18, 2026-11-26 18:03):** new tasks 49–51 (Release 4), expanded 24–26, 31–34, 36–39, 42–43. Branch `docs/adaptive-learning-plan`, docs only. **Task 49 (ADR-016 scoring/mastery/interval/recommendation numbers) is a separate owner approval checkpoint; no adaptive implementation before it.** Roadmap is the approved baseline; new features are targeted amendments.
- Release 2 (Expandable Skill Library): 24 pack import pipeline · 25 authoring + AI prompt with saved material · 26 practice modes · 48 learning material library · 27 gate
- Release 3: 28–30 job tracker (can start any time)
- Follow-ups: 12 retire Sites files from main (approval) · playground PR #6 merge (owner)

## Blockers / owner actions
| ID | Action | Status |
|---|---|---|
| A3 | Sites "Export workspace" JSON | **blocked: button downloads nothing (known issue)** — see Backup limitations |
| A4 | Vercel preview "Export workspace" JSON | **done** 14:46: 27 items, 0 sessions, **identical to the seed defaults** (no user edits found). File kept by owner, not in repo |
| A5 | Neon backup branch `backup-pre-v2` | **done by Claude via Neon connector** 14:49 |
| A6 | Neon inventory query | **done by Claude**: project `career-roadmap` (square-lab-67866008), only table `workspaces`, 0 rows |
| A7 | Vercel: Preview-scoped DATABASE_URL | **done** 15:40, verified by API |
| A8 | Delete stale AUTH_* env vars | **done** by owner 16:32 (Vercel connector has no delete); 5 vars remain: DATABASE_URL×2, DB_ENV×2, OWNER_ID (preview) |
| A2b | Optional: reset Neon `preview` role password (appeared in a screenshot); low risk, empty branch | offered |
| A2 | Push access to jenozu/playground | **granted** 17:15 |
| A9 (deferred by owner) | Vercel protection-bypass secret → GitHub secret `VERCEL_AUTOMATION_BYPASS_SECRET` (e2e on previews) | pending |
| A10 (deferred by owner) | Vercel read token → GitHub secret `VERCEL_TOKEN` (protection check in CI) | pending |
| A11 | Unauthenticated protection checks | **done** via GitHub Actions probe (no approval needed) |
| A12 | Merge PR #2 (plan docs → main); auto-merge blocked by safety classifier | **requested** |
| A14 | Approve Release 1 | **done** 12:49 |
| A17 | Hands-on test of Release 1 on production, then confirm | **requested** |
| A15 | Merge playground PR #6 (engine split; `src/execution` needs owner per harness.json) | requested |
| A16 | Review 5 sample exercises on the preview (task 18 acceptance) | requested |
| A18 | Approve the adaptive-learning plan amendment (tasks 49–51 and expanded tasks) | **done** 2026-11-26 18:03 |
| A19 | Approve ADR-016 numbers (task 49) before task 31 | pending (not yet drafted) |
| A20 | Merge docs PR #4 (`docs/adaptive-learning-plan`): https://github.com/jenozu/sap-certs/pull/4 | requested |
| A21 | Approve (or amend) the Learn/curriculum amendment (tasks 52–53, ADR-017) | **requested** |
| A22 | Release 1 walkthrough Part 1 (register concepts on /skills). Read-only prod check 2026-11-27 09:20: `skills` empty, 0 attempts | **waiting on owner** |
| A13 | Optional: delete leftover branch `probe/prod-r0` (proxy cannot delete) | optional |

## Backup limitations
- **Sites (ChatGPT-hosted, D1) data cannot be exported** (2026-11-25): the footer "Export workspace" button downloads nothing; this happened before and was never resolved. Any data only in Sites is therefore not backed up.
- Mitigation: the Sites deployment is preserved untouched (never redeployed, unpublished or deleted by this project). Its source is frozen at branch `legacy/sites-2026-11-25` (tag push is blocked by the session proxy) (= main `7befba6`). Task 12 removes Sites files from main only, never the deployment.
- Recovery options if needed later: investigate the export button inside Sites (likely a blocked download in the embedded frame; copy-to-clipboard fallback), or re-enter items manually from screenshots.

## Data findings
- Neon (via Vercel preview export, 2026-11-25 14:46): every item and setting equals the built-in defaults; no sessions. Confirmed by query: Neon has **no saved row** (app shows defaults). So production OWNER_ID will be the new value `owner:andel` (ADR-003 fallback); nothing in Neon to migrate.
- Implication: any personal progress entered so far is most likely only in the Sites version, which cannot be exported (see Backup limitations).

## Test results (latest, feat/v2-p2-practice @ 061b92d)
| Suite | Result |
|---|---|
| Vitest (unit + PGlite integration) | 40/40 |
| Playwright (desktop 1440 + mobile 390, VISUAL=1, axe) | 33 passed, 1 skipped |
| content:verify | sql-erp-core 25/25 (reference passes, starter fails, hard-coded fails) |
| tsc / eslint / next build | pass / 0 errors / pass |
| GitHub Actions workspace-ci | success (run 45864539757) |
| Protection probe (Release 1 preview) | 12/12 routes 302 → Vercel login |
| playground (PR #6 branch) | lint, tsc, vitest 106/106, build; e2e sql-lesson pass |

## Deployment status
- **Production: LIVE** — https://career-roadmap-jenozus-projects.vercel.app (deployment dpl_C1ZMyvaS1wcDRzB7PauEsqZE6tsy, main @ 2cbe6ef, Release 1). Vercel Authentication on all routes (18 probed). OWNER_ID=owner:andel. Neon main tables: workspaces, workspace_snapshots, skills, practice_sessions, exercise_attempts, saved_code.
- Preview: isolated Neon `preview` branch (has 0002 practice tables); OWNER_ID=owner:andel-preview. Release 1 preview: career-roadmap-85b27x4ng (061b92d).
- Backups: Neon `backup-pre-v2` (2026-11-25), `backup-pre-release0`, `backup-pre-release1` (2026-11-26).
- Rollback: Vercel instant rollback (Hobby: previous production deployment) + Neon branch restore.

## Relevant commits
- sap-certs `2cbe6ef`: PR #3 Release 1 merged
- sap-certs PR #3 (Release 1): 9987cf2, 51d0df0, 8d5c962, 2c5cc34, 061b92d · playground PR #6: 3a06ab0, eebbfc3
- sap-certs `f75c153`: PR #1 Release 0 merged · `5d10b5e` plan 2.1 multi-language
- playground `4d5f263`: PR #5 phase-6 merged
- `dced9df` spike · `1991894` harness/regression/CI · `9ea12f3` snapshots+import · `00974c3` protection check · `54f4256` CI fix
- sap-certs `2d7e063` (feat/v2-p1-platform): Vercel/Neon setup doc
- sap-certs `368bafb` (feat/v2-p1-platform): health endpoint, server-side owner, guard, next-auth removed
- sap-certs `6e09951`: plan revision 2 (branch docs/pathway-v2-plan)
