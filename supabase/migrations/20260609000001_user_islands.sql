-- Personal Language Islands — the real method: the learner authors their OWN
-- sentences (native language first), which are then translated to validated
-- Finnish. These tables are PER-USER and owner-locked (RLS), separate from the
-- global content tables so they never affect anon content reads.
--
-- `en`         = the learner's own sentence, in their language (the source of truth)
-- `kirjakieli` = standard written Finnish (Voikko-gated before `verified` flips true)
-- `puhekieli`  = colloquial spoken Finnish (text only; no machine validator)
-- `verified`   = TRUE only once the kirjakieli has passed the same Voikko gate the
--                seed content passes. Until then the sentence is a labeled draft.

CREATE TABLE IF NOT EXISTS user_islands (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  topic_slug  TEXT        NOT NULL DEFAULT 'custom',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_islands_user_idx ON user_islands (user_id, created_at DESC);

ALTER TABLE user_islands ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "user_islands_own_rows" ON user_islands
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS user_island_sentences (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  island_id   UUID        NOT NULL REFERENCES user_islands(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  en          TEXT        NOT NULL,
  kirjakieli  TEXT        NOT NULL,
  puhekieli   TEXT,
  verified    BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_island_sentences_island_idx ON user_island_sentences (island_id, sort_order);
CREATE INDEX IF NOT EXISTS user_island_sentences_user_idx   ON user_island_sentences (user_id);

ALTER TABLE user_island_sentences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "user_island_sentences_own_rows" ON user_island_sentences
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_islands          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_island_sentences TO authenticated;
