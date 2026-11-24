# Vercel / Neon migration

Status: PostgreSQL baseline provisioned and verified; adapter source staged, not yet wired into the application or build-tested.

The original Sites runtime remains in place until the Next.js runtime, Neon driver and verified session authentication can be switched together. Do not expose the existing header-based API on Vercel.

- Neon PostgreSQL 17, database neondb, AWS us-east-2.
- PostgreSQL schema: db/postgres/schema.ts.
- Baseline SQL: drizzle-postgres/0000_workspaces.sql.
- Repository: db/postgres/repository.ts; optimistic concurrency and per-user filtering preserved.
- Next: install @neondatabase/serverless and regenerate the lockfile; wire drizzle-orm/neon-http; replace header authentication with verified server-side sessions; switch API routes and build scripts; add import validation and integration tests.
- Configure DATABASE_URL and authentication secrets only in the deployment environment, never in Git.
- Preserve the original D1 migrations and recovered main branch.
- Existing hosted progress is not copied automatically; export/import is a separate step.
