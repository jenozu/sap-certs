# Pathway v2 — implementation checklist

Living status file. Update it at every task change. Source of truth for tasks: `.taskmaster/tasks/tasks.json` (rendered in `05-TASKS.md`).

_Last updated: 2026-11-25 13:35 (America/Toronto)_

## Standing conditions (owner, 2026-11-25)
- Stop for approval before: any production database migration, any destructive operation, any production release.
- Vercel Authentication is the only auth; every production and preview route must be protected.
- Production and preview databases stay isolated.
- Preserve all existing functionality, design and saved data.
- Owner actions are given one at a time, with URLs, clicks, values and how to verify.

## Current
- **Task 2: verify and back up Sites and Neon data** (in progress). Waiting on owner action A3.

## Completed
| Task | Date | Commit | Notes |
|---|---|---|---|
| 0 Audit + plan rev. 1 | 2026-11-25 | — | Baselines recorded in 01-AUDIT.md |
| 1 Approval of revision 2 | 2026-11-25 | this commit | Approved 13:30 |

## Upcoming (Release 0)
3 Isolate preview DB · 4 Compatibility spike · 5 Merge playground phase-6 · 6 Owner identity + hardening · 7 Protection verification · 8 Test harness · 9 Regression/visual baseline · 10 Snapshots + reconciliation import · 11 Release 0 (approval) · 12 Retire Sites scaffolding (approval)

## Blockers / owner actions
| ID | Action | Status |
|---|---|---|
| A3 | Sites "Export workspace" JSON | **requested** |
| A4 | Vercel preview "Export workspace" JSON | pending |
| A5 | Neon backup branch `backup-pre-v2` | pending |
| A6 | Neon inventory query output | pending |
| A2 | Push access to jenozu/playground | requested when task 5 starts |

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
- Preview database: **shared with production**. Fixed in task 3.

## Relevant commits
- sap-certs `6e09951`: plan revision 2 (branch docs/pathway-v2-plan)
