-- Additive (task 10): full copies of a workspace document taken before imports/seeds.
CREATE TABLE IF NOT EXISTS public.workspace_snapshots (
  id bigserial PRIMARY KEY,
  owner_id text NOT NULL,
  source text NOT NULL CHECK (source IN ('pre-import','pre-seed','manual')),
  data jsonb NOT NULL,
  version integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS workspace_snapshots_owner_idx ON public.workspace_snapshots (owner_id, created_at DESC);
