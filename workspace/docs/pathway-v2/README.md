# Pathway v2 upgrade plan — revision 2

Status: **awaiting owner approval of revision 2**. No implementation has started.

| Document | Purpose |
|---|---|
| [01-AUDIT.md](01-AUDIT.md) | Source SHAs, baseline results, deployment/data state, reusable parts, gaps, conflicts, owner decisions, protection check |
| [../../.taskmaster/docs/prd.md](../../.taskmaster/docs/prd.md) | PRD: goal, principles, releases with success criteria, capabilities, decision log |
| [02-ARCHITECTURE.md](02-ARCHITECTURE.md) | System design, ADR-001…013, additive data model per release, API, deployment, security |
| [03-ROADMAP.md](03-ROADMAP.md) | Phases → releases, what changed from revision 1, rationale, procedure, deployment |
| [04-TRACEABILITY.md](04-TRACEABILITY.md) | Owner adjustments, master plan and Practice Lab requirements → UI, data, tests, tasks |
| [05-TASKS.md](05-TASKS.md) | 47 tasks with acceptance criteria (rendered from `.taskmaster/tasks/tasks.json`) |
| [06-OWNER-ACTIONS.md](06-OWNER-ACTIONS.md) | Actions that need your logins or secret values |

Paths are relative to `jenozu/sap-certs/workspace/`.

**Revised order:** platform safety + spike (Release 0) → SQL Practice Lab with attempts and Skill Library v1 (Release 1) → expandable Skill Library (Release 2) → job tracker (Release 3, can ship any time after Release 1) → mastery and review (Release 4) → career layer (Release 5) → 100 exercises and acceptance (Release 6) → JS/TS/Node practice → Python (deferred).
