# Pathway v2 — implementation checklist

Living status file. Update it at every task change. Source of truth for tasks: `.taskmaster/tasks/tasks.json` (rendered in `05-TASKS.md`).

_Last updated: 2026-11-25 15:47 (America/Toronto)_

## Standing conditions (owner, 2026-11-25)
- Stop for approval before: any production database migration, any destructive operation, any production release.
- Vercel Authentication is the only auth; every production and preview route must be protected.
- Production and preview databases stay isolated.
- Preserve all existing functionality, design and saved data.
- Owner actions are given one at a time, with URLs, clicks, values and how to verify.

## Current
- **Task 6: owner identity + hardening** (in progress on branch `feat/v2-p1-platform`): code done; remaining: README/docs update, route tests (with task 8), removal of stale AUTH_* env vars (**needs owner approval: destructive**).
- Next independent work: task 4 compatibility spike, task 8 test harness.

## Completed
| Task | Date | Commit | Notes |
|---|---|---|---|
| 0 Audit + plan rev. 1 | 2026-11-25 | — | Baselines recorded in 01-AUDIT.md |
| 1 Approval of revision 2 | 2026-11-25 | cf65201 | Approved 13:30 |
| 3 Isolate preview DB | 2026-11-25 | 368bafb | Neon `preview` branch; Vercel DATABASE_URL split Production/Preview (verified via API); DB_ENV + preview OWNER_ID set; preview `/api/health` → dbEnv=preview |
| 2 Verify and back up data | 2026-11-25 | this commit | Neon backup branch `backup-pre-v2` (br-ancient-heart-bdf2u1lx); Neon `workspaces` has **0 rows**; Sites not exportable (limitation) |

## Upcoming (Release 0)
3 Isolate preview DB · 4 Compatibility spike · 5 Merge playground phase-6 · 6 Owner identity + hardening · 7 Protection verification · 8 Test harness · 9 Regression/visual baseline · 10 Snapshots + reconciliation import · 11 Release 0 (approval) · 12 Retire Sites scaffolding (approval)

## Blockers / owner actions
| ID | Action | Status |
|---|---|---|
| A3 | Sites "Export workspace" JSON | **blocked: button downloads nothing (known issue)** — see Backup limitations |
| A4 | Vercel preview "Export workspace" JSON | **done** 14:46: 27 items, 0 sessions, **identical to the seed defaults** (no user edits found). File kept by owner, not in repo |
| A5 | Neon backup branch `backup-pre-v2` | **done by Claude via Neon connector** 14:49 |
| A6 | Neon inventory query | **done by Claude**: project `career-roadmap` (square-lab-67866008), only table `workspaces`, 0 rows |
| A7 | Vercel: Preview-scoped DATABASE_URL | **done** 15:40, verified by API |
| A8 | Approve deleting stale env vars AUTH_SECRET (×4), AUTH_GITHUB_ID, AUTH_GITHUB_SECRET | **requested** |
| A2b | Optional: reset Neon `preview` role password (appeared in a screenshot); low risk, empty branch | offered |
| A2 | Push access to jenozu/playground | requested when task 5 starts |

## Backup limitations
- **Sites (ChatGPT-hosted, D1) data cannot be exported** (2026-11-25): the footer "Export workspace" button downloads nothing; this happened before and was never resolved. Any data only in Sites is therefore not backed up.
- Mitigation: the Sites deployment is preserved untouched (never redeployed, unpublished or deleted by this project). Its source is frozen at branch `legacy/sites-2026-11-25` (tag push is blocked by the session proxy) (= main `7befba6`). Task 12 removes Sites files from main only, never the deployment.
- Recovery options if needed later: investigate the export button inside Sites (likely a blocked download in the embedded frame; copy-to-clipboard fallback), or re-enter items manually from screenshots.

## Data findings
- Neon (via Vercel preview export, 2026-11-25 14:46): every item and setting equals the built-in defaults; no sessions. Confirmed by query: Neon has **no saved row** (app shows defaults). So production OWNER_ID will be the new value `owner:andel` (ADR-003 fallback); nothing in Neon to migrate.
- Implication: any personal progress entered so far is most likely only in the Sites version, which cannot be exported (see Backup limitations).

## Test results (latest)
| Target | Result | Date |
|---|---|---|
| playground main | lint, typecheck, 95/95 vitest, build pass | 2026-11-25 |
| playground phase-6 | 106/106 vitest, typecheck pass | 2026-11-25 |
| workspace main | tsc, unit, build pass; lint 1 pre-existing error | 2026-11-25 |
| workspace vercel branch | tsc, next build pass; D1 unit test fails (expected; replaced in task 8) | 2026-11-25 |

## Deployment status
- Production: **not live** (main builds fail on Vercel; expected until Release 0).
- Preview (`feat/workspace-vercel-migration` @ b316f09): READY, protected (302 → Vercel login).
- Preview database: **isolated** (Neon `preview` branch) since 15:40.
- Preview `feat/v2-p1-platform` @ 368bafb: READY, `/api/health` = {dbEnv: preview, ownerConfigured: true}.
- Production OWNER_ID: intentionally **unset** until task 7 protection checks.

## Relevant commits
- sap-certs `368bafb` (feat/v2-p1-platform): health endpoint, server-side owner, guard, next-auth removed
- sap-certs `6e09951`: plan revision 2 (branch docs/pathway-v2-plan)
