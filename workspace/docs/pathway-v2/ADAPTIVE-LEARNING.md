# Pathway — Adaptive learning and personalized mastery

Status: proposed requirements for owner review; not implemented. Integration into the plan is approved (A18, 2026-11-26): ADR-016 and tasks 49–51, with the scoring/scheduling numbers awaiting separate approval in task 49; see `04-TRACEABILITY.md`. Integrate with the existing academy roadmap rather than replacing it.

## Objective
Make Pathway actively recommend what to learn, reinforce and review across all supported languages. Share evidence across Learn, Practice and Skill Library; sandbox activity alone is not graded mastery evidence.

## Proficiency and reinforcement
Default configurable threshold: 80% inclusive. Illustrative bands: 0–49% revisit lessons and easier exercises; 50–80% targeted reinforcement and next-day review; 81–89% continue with periodic reinforcement; 90–100% harder challenges and longer review intervals. Track concept-level evidence and aggregate by module, course and language. Distinguish insufficient evidence from low proficiency. Track recurring errors, independent first attempts, hints, solution views and exercise versions. Repeated identical exercises must not inflate mastery. Course completion is not mastery. Propose and obtain approval for the scoring formula, minimum distinct exercises, independent evidence and delayed retention criteria.

## Adaptive scheduling
Initial review intervals: 1, 3, 7, 14, 30 days. Extend on demonstrated retention and shorten on weak performance. Prioritize overdue and weak concepts, unfamiliar exercises and mixed practice. Allow new learning alongside reinforcement; do not impose unnecessary gates. If exercises are insufficient, identify the gap and offer generation/import through the expandable library.

## Illustrative week
- Monday: learn CTEs, 10 exercises, 60%; schedule targeted reinforcement.
- Tuesday: 5 unfamiliar CTE exercises, 80%; remain in review queue.
- Wednesday: mixed CTE/JOIN/aggregate exercises, 90%; increase difficulty and interval.
- Thursday: new material.
- Friday: unfamiliar unassisted retention check, 100%; schedule review in seven days.
- Sunday: cumulative assessment informs next week's plan.

## Dashboard and settings
Show concept proficiency, evidence count, mastery, weak topics, due reviews, daily recommended exercises, difficulty and estimated time, next lesson and weekly assessment summary. Example: CTE 55%, CROSS JOIN 60%, LEFT JOIN 75% -> recommend 5, 5 and 3 exercises respectively (illustrative only).
Integrate daily queue into existing weekly study schedule. Settings: reinforcement threshold (80%), review budget (15/30/45/60 minutes), adaptive difficulty, spaced repetition, weekly assessment frequency, mastery requirements and new-learning/review balance.

## Architecture and implementation
Reuse existing language adapters, versioned exercises, saved attempts, course/module/concept links and import pipeline. No SQL-specific mastery logic. Keep execution isolated from production. Preserve existing records and derive mastery from historical attempts where valid. Propose scoring, review scheduling, exercise selection, data model and incremental release dependencies before implementation. Update PRD, architecture, roadmap, task list and persistent checklist; obtain owner approval.

## Acceptance criteria
- At 80% or lower, targeted practice is recommended; changing threshold changes recommendations.
- Insufficient evidence is not treated as mastery; repeated identical or assisted solutions do not inflate independent mastery.
- Weak performance shortens review intervals; strong delayed retention extends them.
- Daily queue respects time budget, prioritizes weak/overdue concepts and prefers unfamiliar exercises.
- Weekly assessment results influence the next week's schedule without blocking new learning.
- Missing exercise coverage produces an actionable import/generation suggestion.
- Same rules work for SQL and future language adapters; existing data and exercise history remain intact.
- Automated tests cover threshold boundaries, duplicate attempts, assisted attempts, review dates, settings, content gaps and persistence.

All numerical examples and intervals are proposed defaults, not measured user results or finalized scoring algorithms.
