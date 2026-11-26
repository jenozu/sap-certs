-- Additive (task 14): language-neutral practice data. language is free text (ADR-014/015).
CREATE TABLE IF NOT EXISTS public.skills (
  owner_id text NOT NULL,
  id text NOT NULL,
  language text NOT NULL,
  name text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  state text NOT NULL DEFAULT 'introduced' CHECK (state IN ('introduced','practising','understood','proficient','mastered')),
  source text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  rev integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id)
);
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  owner_id text NOT NULL,
  id text NOT NULL,
  language text NOT NULL,
  config jsonb NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  PRIMARY KEY (owner_id, id)
);
CREATE TABLE IF NOT EXISTS public.exercise_attempts (
  owner_id text NOT NULL,
  id text NOT NULL,
  language text NOT NULL,
  exercise_id text NOT NULL,
  exercise_version text NOT NULL,
  content_hash text NOT NULL,
  pack_id text NOT NULL,
  skills text[] NOT NULL DEFAULT '{}',
  mode text NOT NULL,
  code text NOT NULL,
  passed boolean NOT NULL,
  correct boolean NOT NULL,
  construct_ok boolean NOT NULL,
  results jsonb NOT NULL,
  hints_used integer NOT NULL DEFAULT 0 CHECK (hints_used >= 0),
  solution_viewed boolean NOT NULL DEFAULT false,
  independent boolean NOT NULL,
  practice_session_id text,
  duration_ms integer NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  started_at timestamptz NOT NULL,
  submitted_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id)
);
CREATE INDEX IF NOT EXISTS exercise_attempts_exercise_idx ON public.exercise_attempts (owner_id, exercise_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS exercise_attempts_skills_idx ON public.exercise_attempts USING gin (skills);
CREATE TABLE IF NOT EXISTS public.saved_code (
  owner_id text NOT NULL,
  exercise_id text NOT NULL,
  language text NOT NULL,
  code text NOT NULL,
  rev integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, exercise_id)
);
