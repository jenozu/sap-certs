# Pathway v2 — implementation checklist

Living status file. Update it at every task change. Source of truth for tasks: `.taskmaster/tasks/tasks.json` (rendered in `05-TASKS.md`).

_Last updated: 2026-11-25 17:12 (America/Toronto)_

## Standing conditions (owner, 2026-11-25)
- Stop for approval before: any production database migration, any destructive operation, any production release.
- Vercel Authentication is the only auth; every production and preview route must be protected.
- Production and preview databases stay isolated.
- Preserve all existing functionality, design and saved data.
- Owner actions are given one at a time, with URLs, clicks, values and how to verify.

## Current
- **Task 7: protection verification** (in progress). Remaining: unauthenticated checks of the new preview routes (needs owner to approve web requests), production domain check at Release 0, `VERCEL_TOKEN` CI secret (A10).
- **Task 5: merge playground phase-6**: waiting on push access to jenozu/playground (A2).
- Then **task 11: Release 0** (mandatory approval: production migration + production release).

## Completed
| Task | Date | Commit | Notes |
|---|---|---|---|
| 0 Audit + plan rev. 1 | 2026-11-25 | — | Baselines recorded in 01-AUDIT.md |
| 1 Approval of revision 2 | 2026-11-25 | cf65201 | Approved 13:30 |
| 10 Snapshots + validated import | 2026-11-25 | 9ea12f3 | Additive `workspace_snapshots`; dry-run preview; never deletes; applied to **preview** DB only |
| 9 Regression + visual baseline | 2026-11-25 | 1991894 | 8 views × desktop/mobile; 16 screenshots (VISUAL=1); axe baseline |
| 8 Test harness + CI | 2026-11-25 | 1991894, 54f4256 | Vitest+PGlite, Playwright, GitHub Actions green |
| 6 Owner identity + hardening | 2026-11-25 | 368bafb, dd6b7d2 | OWNER_ID fail-closed, guard, next-auth + AUTH_* vars removed, route tests |
| 4 Compatibility spike | 2026-11-25 | dced9df | Engine works in Next 16/React 19 prod build, CSP, timeout recovery, mobile. One shim (Vite worker ref) until upstream PR |
| 3 Isolate preview DB | 2026-11-25 | 368bafb | Neon `preview` branch; Vercel DATABASE_URL split Production/Preview (verified via API); DB_ENV + preview OWNER_ID set; preview `/api/health` → dbEnv=preview |
| 2 Verify and back up data | 2026-11-25 | this commit | Neon backup branch `backup-pre-v2` (br-ancient-heart-bdf2u1lx); Neon `workspaces` has **0 rows**; Sites not exportable (limitation) |

## Upcoming
Release 0: 5 Merge playground phase-6 · 7 finish protection checks · 11 Release 0 (approval) · 12 Retire Sites files (approval)
Release 1: 13 Vendor engine (upstream PR) · 14 Practice tables · 15 Evaluator · 16 Pack format · 17 Dataset · 18 Priority exercises · 19 Focus view · 20 Skill Library v1 · 21 Export v2 · 22 Nav · 23 Release 1

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
| A2 | Push access to jenozu/playground | **requested now** |
| A9 | Vercel protection-bypass secret → GitHub secret `VERCEL_AUTOMATION_BYPASS_SECRET` (e2e on previews) | pending |
| A10 | Vercel read token → GitHub secret `VERCEL_TOKEN` (protection check in CI) | pending |
| A11 | Approve web requests so Claude can run unauthenticated protection checks | **requested** |

## Backup limitations
- **Sites (ChatGPT-hosted, D1) data cannot be exported** (2026-11-25): the footer "Export workspace" button downloads nothing; this happened before and was never resolved. Any data only in Sites is therefore not backed up.
- Mitigation: the Sites deployment is preserved untouched (never redeployed, unpublished or deleted by this project). Its source is frozen at branch `legacy/sites-2026-11-25` (tag push is blocked by the session proxy) (= main `7befba6`). Task 12 removes Sites files from main only, never the deployment.
- Recovery options if needed later: investigate the export button inside Sites (likely a blocked download in the embedded frame; copy-to-clipboard fallback), or re-enter items manually from screenshots.

## Data findings
- Neon (via Vercel preview export, 2026-11-25 14:46): every item and setting equals the built-in defaults; no sessions. Confirmed by query: Neon has **no saved row** (app shows defaults). So production OWNER_ID will be the new value `owner:andel` (ADR-003 fallback); nothing in Neon to migrate.
- Implication: any personal progress entered so far is most likely only in the Sites version, which cannot be exported (see Backup limitations).

## Test results (latest, branch feat/v2-p1-platform @ 54f4256)
| Suite | Result |
|---|---|
| Vitest (unit + PGlite integration) | 9/9 pass |
| Playwright local (desktop 1440 + mobile 390, VISUAL=1) | 21 passed, 1 skipped (search is desktop-only) |
| tsc / eslint | pass / 0 errors (7 pre-existing warnings) |
| next build | pass |
| GitHub Actions workspace-ci | **success** (run 45710713644) |
| playground main / phase-6 | 95/95, 106/106 (2026-11-25 audit) |

## Deployment status
- Production: **not live** (main builds fail on Vercel; expected until Release 0).
- Preview (`feat/workspace-vercel-migration` @ b316f09): READY, protected (302 → Vercel login).
- Preview database: **isolated** (Neon `preview` branch) since 15:40.
- Preview `feat/v2-p1-platform`: READY (latest build per push); `/api/health` = {dbEnv: preview, ownerConfigured: true}; preview DB has `workspace_snapshots`.
- Production DB (Neon main): unchanged; `workspace_snapshots` **not yet created** (needs approval at Release 0).
- Production OWNER_ID: intentionally **unset** until task 7 protection checks.

## Relevant commits
- `dced9df` spike · `1991894` harness/regression/CI · `9ea12f3` snapshots+import · `00974c3` protection check · `54f4256` CI fix
- sap-certs `2d7e063` (feat/v2-p1-platform): Vercel/Neon setup doc
- sap-certs `368bafb` (feat/v2-p1-platform): health endpoint, server-side owner, guard, next-auth removed
- sap-certs `6e09951`: plan revision 2 (branch docs/pathway-v2-plan)
