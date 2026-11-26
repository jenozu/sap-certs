"""Writes course.json + lesson files from tools/exercises.py. Run from the pack folder."""
import json, shutil, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from exercises import E

ROOT = Path(__file__).resolve().parent.parent
FIX = ["base", "variant-b", "variant-c"]
GROUPS = [("left-join", "LEFT JOIN"), ("cross-join", "CROSS JOIN"), ("union", "UNION and UNION ALL"), ("cte", "WITH / CTE"), ("mixed", "Mixed practice")]
shutil.rmtree(ROOT / "lessons", ignore_errors=True)
modules = []
for gid, gtitle in GROUPS:
    lessons = []
    for e in [x for x in E if x["id"].split(".")[1].startswith(gid) and (gid != "union" or x["id"].split(".")[1] in ("union", "union-all"))]:
        slug = e["id"].replace(".", "-")
        d = ROOT / "lessons" / slug
        d.mkdir(parents=True)
        md = f"# {e['title']}\n\n**Why it matters:** {e['purpose']}\n\n{e['task']}\n\nTables are described in the schema panel. Dialect: SQLite.\n"
        (d / "lesson.md").write_text(md)
        (d / "starter.sql").write_text(e["starter"].rstrip() + "\n")
        (d / "solution.sql").write_text(e["solution"].rstrip() + "\n")
        (d / "tests.json").write_text(json.dumps({"language": "sql", "grading": {"fixtures": FIX, "requiredConstructs": e["constructs"], "orderMatters": e["order"]}}, indent=2) + "\n")
        base = f"lessons/{slug}/"
        lessons.append({"id": slug, "title": e["title"], "type": "debugging" if e["kind"] == "debugging" else "coding", "content": base + "lesson.md", "estimatedMinutes": 8,
                        "exercise": {"type": "sql", "starter": base + "starter.sql", "tests": base + "tests.json", "solution": base + "solution.sql", "dataset": "datasets/base.sql",
                                     "hints": e["hints"], "exerciseId": e["id"], "exerciseVersion": "1.0.0", "skills": e["skills"], "difficulty": e["difficulty"],
                                     "kind": e["kind"], "businessPurpose": e["purpose"]}})
    modules.append({"id": gid, "title": gtitle, "lessons": lessons})
course = {"schemaVersion": 1, "id": "sql-erp-core", "title": "SQL for ERP data: core joins, unions and CTEs", "version": "1.0.0", "language": "sql",
          "description": "Seed practice pack on a synthetic distributor database: LEFT JOIN, CROSS JOIN, UNION / UNION ALL, WITH (CTE) and mixed business queries.",
          "difficulty": "beginner", "estimatedHours": 4, "author": "Pathway", "source": "Pathway seed content",
          "fixtures": {f: f"datasets/{f}.sql" for f in FIX}, "modules": modules}
(ROOT / "course.json").write_text(json.dumps(course, indent=2) + "\n")
print("exercises:", sum(len(m["lessons"]) for m in modules))
