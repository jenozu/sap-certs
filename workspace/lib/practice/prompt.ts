// Copyable prompt for generating a practice pack with any AI chat (no server AI call).
// Release 2 adds saved learning materials as extra context.
export function generationPrompt(o: { language: string; concepts: { id: string; name: string }[]; count: number; difficulty: string; notes?: string; source?: string; schemaSummary?: string }) {
  return `Create a Pathway practice pack (JSON + files) for ${o.language.toUpperCase()}.

Concepts to practise (use these exact skill ids):
${o.concepts.map(c => `- ${c.id}: ${c.name}`).join('\n')}
Number of exercises: ${o.count}. Difficulty: ${o.difficulty}.
${o.source ? `Where I learned it: ${o.source}\n` : ''}${o.notes ? `My notes:\n${o.notes}\n` : ''}
Rules:
- Every exercise has a realistic ERP / distribution business purpose (orders, inventory, suppliers, shipments).
- Synthetic, fictional data only. Never real company or personal data.
- Each exercise: instructions (Markdown), starter code, reference solution, 2-4 progressive hints.
- SQL: SQLite dialect; graded exercises list at least 2 dataset fixtures so hard-coded answers fail; list requiredConstructs (e.g. "LEFT JOIN", "WITH", "UNION ALL").
${o.schemaSummary ? `- Use this database schema (fixtures base, variant-b, variant-c already exist):\n${o.schemaSummary}\n` : ''}
Output format (playground course.json structure):
- course.json: { "schemaVersion": 1, "id": "<pack-slug>", "title", "version": "1.0.0", "language": "${o.language}", "description", "difficulty": "beginner|intermediate|advanced", "estimatedHours", "fixtures": { "<id>": "datasets/<id>.sql" }, "modules": [ { "id", "title", "lessons": [ { "id": "<slug>", "title", "type": "coding", "content": "lessons/<slug>/lesson.md", "estimatedMinutes": 8, "exercise": { "type": "${o.language}", "starter": "lessons/<slug>/starter.sql", "tests": "lessons/<slug>/tests.json", "solution": "lessons/<slug>/solution.sql", "hints": ["..."], "exerciseId": "<lang>.<concept>.<name>", "exerciseVersion": "1.0.0", "skills": ["<skill id>"], "difficulty": "intro|core|stretch", "kind": "targeted|debugging|predict-output|business", "businessPurpose": "..." } } ] } ] }
- tests.json (SQL): { "language": "sql", "grading": { "fixtures": ["base", "variant-b", "variant-c"], "requiredConstructs": ["..."], "orderMatters": false } }
Return every file with its path.`;
}
