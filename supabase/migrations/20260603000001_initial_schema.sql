-- PuhuScribe initial schema
-- Finnish learning app with FSRS-5 spaced repetition

-- ---------------------------------------------------------------------------
-- ENUMs
-- ---------------------------------------------------------------------------

CREATE TYPE cefr_level       AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
CREATE TYPE card_state        AS ENUM ('new', 'learning', 'review', 'relearning');
CREATE TYPE card_type         AS ENUM (
  'word_recognition',   -- see Finnish word, recall English meaning
  'word_production',    -- see English word, produce Finnish
  'sentence_listening', -- listen to audio, answer comprehension
  'sentence_speaking'   -- see prompt, speak Finnish aloud (YKI speaking prep)
);
CREATE TYPE dialect           AS ENUM ('standard', 'colloquial');
CREATE TYPE speaker_gender    AS ENUM ('M', 'F');

-- ---------------------------------------------------------------------------
-- Users  (extends auth.users)
-- ---------------------------------------------------------------------------

CREATE TABLE users (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT        NOT NULL,
  display_name    TEXT,
  target_level    cefr_level  NOT NULL DEFAULT 'B1',

  -- 12 new cards/day: calibrated for sustainable acquisition (10–15 words/day target range).
  -- Research on spaced repetition suggests 10–15 items/day balances daily review load
  -- against learning velocity for working adults. 30 (Anki default) accumulates
  -- unsustainable reviews within weeks. 12 is the deliberate starting point; users may
  -- adjust upward once they've established a consistent review habit.
  daily_new_cards INT         NOT NULL DEFAULT 12 CHECK (daily_new_cards BETWEEN 1 AND 100),

  timezone        TEXT        NOT NULL DEFAULT 'Europe/Helsinki',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_row" ON users
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Topics  (25 YKI-aligned themes, seeded separately)
-- ---------------------------------------------------------------------------

CREATE TABLE topics (
  id           SERIAL      PRIMARY KEY,
  slug         TEXT        NOT NULL UNIQUE,
  name_fi      TEXT        NOT NULL,
  name_en      TEXT        NOT NULL,
  yki_category TEXT        NOT NULL,   -- e.g. 'daily_life', 'work', 'civic'
  sort_order   INT         NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- Words
-- ---------------------------------------------------------------------------

CREATE TABLE words (
  id              SERIAL      PRIMARY KEY,
  base_form       TEXT        NOT NULL UNIQUE,
  translation_en  TEXT        NOT NULL,
  frequency_rank  INT,                   -- lower = more frequent
  level           cefr_level  NOT NULL DEFAULT 'A1',
  part_of_speech  TEXT,
  topic_id        INT         REFERENCES topics(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX words_topic_idx       ON words (topic_id);
CREATE INDEX words_frequency_idx   ON words (frequency_rank);
CREATE INDEX words_level_idx       ON words (level);

-- ---------------------------------------------------------------------------
-- Audio
-- ---------------------------------------------------------------------------

CREATE TABLE audio (
  id              SERIAL      PRIMARY KEY,
  storage_path    TEXT        NOT NULL UNIQUE,  -- Supabase Storage object path
  duration_ms     INT,
  speaker_gender  speaker_gender,
  dialect         dialect,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Sentences  (kirjakieli + puhekieli pair)
-- ---------------------------------------------------------------------------

CREATE TABLE sentences (
  id              SERIAL      PRIMARY KEY,
  kirjakieli      TEXT        NOT NULL,            -- standard written Finnish
  puhekieli       TEXT,                            -- colloquial spoken Finnish
  translation_en  TEXT        NOT NULL,
  level           cefr_level  NOT NULL DEFAULT 'A1',
  topic_id        INT         REFERENCES topics(id) ON DELETE SET NULL,
  audio_id        INT         REFERENCES audio(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX sentences_topic_idx ON sentences (topic_id);
CREATE INDEX sentences_level_idx ON sentences (level);

-- ---------------------------------------------------------------------------
-- Mnemonics
-- ---------------------------------------------------------------------------

CREATE TABLE mnemonics (
  id          SERIAL      PRIMARY KEY,
  word_id     INT         NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,  -- NULL = system-created
  text        TEXT        NOT NULL,
  image_url   TEXT,
  is_public   BOOLEAN     NOT NULL DEFAULT FALSE,
  upvotes     INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX mnemonics_word_idx ON mnemonics (word_id);

ALTER TABLE mnemonics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mnemonics_read_public_or_own" ON mnemonics
  FOR SELECT USING (is_public OR auth.uid() = user_id);

CREATE POLICY "mnemonics_insert_own" ON mnemonics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mnemonics_update_own" ON mnemonics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "mnemonics_delete_own" ON mnemonics
  FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Language Islands  (grouped sets of sentences within a topic)
-- ---------------------------------------------------------------------------

CREATE TABLE language_islands (
  id                SERIAL  PRIMARY KEY,
  topic_id          INT     NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  name_fi           TEXT    NOT NULL,
  name_en           TEXT    NOT NULL,
  sort_order        INT     NOT NULL DEFAULT 0,
  unlock_threshold  INT     NOT NULL DEFAULT 0  -- XP or cards needed to unlock
);

CREATE INDEX language_islands_topic_idx ON language_islands (topic_id);

CREATE TABLE island_sentences (
  island_id    INT NOT NULL REFERENCES language_islands(id) ON DELETE CASCADE,
  sentence_id  INT NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
  sort_order   INT NOT NULL DEFAULT 0,
  PRIMARY KEY (island_id, sentence_id)
);

-- ---------------------------------------------------------------------------
-- Cards  (FSRS scheduling state per user per item)
-- ---------------------------------------------------------------------------

CREATE TABLE cards (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id         INT         REFERENCES words(id) ON DELETE CASCADE,
  sentence_id     INT         REFERENCES sentences(id) ON DELETE CASCADE,
  card_type       card_type   NOT NULL,

  -- FSRS-5 state
  due             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stability       FLOAT       NOT NULL DEFAULT 0,
  difficulty      FLOAT       NOT NULL DEFAULT 0,
  elapsed_days    INT         NOT NULL DEFAULT 0,
  scheduled_days  INT         NOT NULL DEFAULT 0,
  reps            INT         NOT NULL DEFAULT 0,
  lapses          INT         NOT NULL DEFAULT 0,
  state           card_state  NOT NULL DEFAULT 'new',
  last_review     TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A card is tied to exactly one content item
  CONSTRAINT card_has_one_item CHECK (
    (word_id IS NOT NULL)::INT + (sentence_id IS NOT NULL)::INT = 1
  )
);

CREATE INDEX cards_user_due_idx   ON cards (user_id, due);
CREATE INDEX cards_user_state_idx ON cards (user_id, state);
CREATE INDEX cards_word_idx       ON cards (word_id);
CREATE INDEX cards_sentence_idx   ON cards (sentence_id);

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cards_own_rows" ON cards
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Review Logs  (append-only audit trail)
-- ---------------------------------------------------------------------------

CREATE TABLE review_logs (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id           UUID        NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating            SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 4),
  state_before      card_state  NOT NULL,
  stability_before  FLOAT       NOT NULL,
  difficulty_before FLOAT       NOT NULL,
  elapsed_days      INT         NOT NULL,
  scheduled_days    INT         NOT NULL,
  review_time       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX review_logs_card_idx ON review_logs (card_id);
CREATE INDEX review_logs_user_idx ON review_logs (user_id, review_time DESC);

ALTER TABLE review_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_logs_own_rows" ON review_logs
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger for users
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
