-- PostgreSQL baseline; safe to apply to the already provisioned Neon database.
CREATE TABLE IF NOT EXISTS public.workspaces (
  user_id text PRIMARY KEY,
  data jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1,
  CONSTRAINT workspaces_version_check CHECK (version >= 1)
);
