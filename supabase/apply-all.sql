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
-- YKI-aligned topic seed data (25 topics)
-- Covers the five YKI test domains: daily life, social participation, work/study,
-- public services, and civic/cultural contexts.

INSERT INTO topics (slug, name_fi, name_en, yki_category, sort_order) VALUES
  -- Daily Life (arkielämä)
  ('greetings',         'Tervehtiminen ja esittäytyminen', 'Greetings & introductions',   'daily_life', 10),
  ('family',            'Perhe ja ihmissuhteet',           'Family & relationships',       'daily_life', 20),
  ('home',              'Koti ja asuminen',                'Home & housing',               'daily_life', 30),
  ('food_drink',        'Ruoka ja juoma',                  'Food & drink',                 'daily_life', 40),
  ('shopping',          'Ostokset ja kauppa',              'Shopping',                     'daily_life', 50),
  ('daily_routines',    'Arkirutiinit ja vapaa-aika',      'Daily routines & free time',   'daily_life', 60),

  -- Social Participation (osallistuminen)
  ('health',            'Terveys ja sairaanhoito',         'Health & healthcare',          'social',     110),
  ('transport',         'Liikenne ja matkustaminen',       'Transport & travel',           'social',     120),
  ('weather',           'Sää ja vuodenajat',               'Weather & seasons',            'social',     130),
  ('hobbies',           'Harrastukset ja urheilu',         'Hobbies & sports',             'social',     140),
  ('events',            'Tapahtumat ja juhlat',            'Events & celebrations',        'social',     150),

  -- Work & Study (työ ja opiskelu)
  ('work_general',      'Työ ja ammatti',                  'Work & profession',            'work_study', 210),
  ('workplace',         'Työpaikka ja työkaverit',         'Workplace & colleagues',       'work_study', 220),
  ('job_search',        'Työnhaku ja CV',                  'Job seeking & CV',             'work_study', 230),
  ('education',         'Opiskelu ja koulutus',            'Education & study',            'work_study', 240),
  ('technology',        'Teknologia ja digitaalinen arki', 'Technology & digital life',    'work_study', 250),

  -- Public Services (julkiset palvelut)
  ('banking',           'Pankki ja raha-asiat',            'Banking & money',              'public',     310),
  ('post_office',       'Posti ja paketit',                'Post & parcels',               'public',     320),
  ('housing_services',  'Asumispalvelut ja viranomaiset',  'Housing services & officials', 'public',     330),
  ('emergency',         'Hätätilanteet ja turvallisuus',   'Emergencies & safety',         'public',     340),

  -- Civic & Cultural (yhteiskunta ja kulttuuri)
  ('city_life',         'Kaupunki ja ympäristö',           'City life & environment',      'civic',      410),
  ('media_news',        'Media ja uutiset',                'Media & news',                 'civic',      420),
  ('integration',       'Kotoutuminen ja kulttuuri',       'Integration & culture',        'civic',      430),
  ('rights_duties',     'Oikeudet ja velvollisuudet',      'Rights & duties',              'civic',      440),
  ('yki_exam_prep',     'YKI-kokeeseen valmistautuminen',  'YKI exam preparation',         'civic',      450);
-- Source: Leipzig Corpora Collection Finnish (CC BY 4.0). Frequency ranks are approximate and based on Leipzig corpus ordering.
-- 500 A1–A2 vocabulary entries covering all 25 YKI topic areas.
-- Ranks 1–250 = A1, ranks 251–500 = A2 (approximate).

INSERT INTO words (base_form, translation_en, frequency_rank, level, part_of_speech, topic_id) VALUES

-- ============================================================
-- GREETINGS & INTRODUCTIONS (topic slug: greetings)
-- ============================================================
('hei',           'hi / hello',                          3,   'A1', 'particle',    (SELECT id FROM topics WHERE slug = 'greetings')),
('moi',           'hi (informal)',                        5,   'A1', 'particle',    (SELECT id FROM topics WHERE slug = 'greetings')),
('terve',         'hi / healthy',                        12,  'A1', 'adjective',   (SELECT id FROM topics WHERE slug = 'greetings')),
('hyvää',         'good (partitive)',                    15,  'A1', 'adjective',   (SELECT id FROM topics WHERE slug = 'greetings')),
('huomenta',      'good morning (partitive)',             18,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'greetings')),
('päivää',        'good day (partitive)',                 20,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'greetings')),
('iltaa',         'good evening (partitive)',             22,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'greetings')),
('yötä',          'good night (partitive)',               24,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'greetings')),
('näkemiin',      'goodbye',                             25,  'A1', 'particle',    (SELECT id FROM topics WHERE slug = 'greetings')),
('moikka',        'bye (informal)',                       27,  'A1', 'particle',    (SELECT id FROM topics WHERE slug = 'greetings')),
('kiitos',        'thank you',                            2,   'A1', 'particle',    (SELECT id FROM topics WHERE slug = 'greetings')),
('ole hyvä',      'you''re welcome / here you go',        30,  'A1', 'particle',    (SELECT id FROM topics WHERE slug = 'greetings')),
('anteeksi',      'excuse me / sorry',                   35,  'A1', 'particle',    (SELECT id FROM topics WHERE slug = 'greetings')),
('nimi',          'name',                                 40,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'greetings')),
('minä',          'I (formal)',                           1,   'A1', 'pronoun',     (SELECT id FROM topics WHERE slug = 'greetings')),
('sinä',          'you (singular)',                       6,   'A1', 'pronoun',     (SELECT id FROM topics WHERE slug = 'greetings')),
('hän',           'he / she',                            8,   'A1', 'pronoun',     (SELECT id FROM topics WHERE slug = 'greetings')),
('me',            'we',                                  10,  'A1', 'pronoun',     (SELECT id FROM topics WHERE slug = 'greetings')),
('te',            'you (plural / formal)',                11,  'A1', 'pronoun',     (SELECT id FROM topics WHERE slug = 'greetings')),
('he',            'they',                                13,  'A1', 'pronoun',     (SELECT id FROM topics WHERE slug = 'greetings')),

-- ============================================================
-- FAMILY & RELATIONSHIPS (topic slug: family)
-- ============================================================
('perhe',         'family',                              45,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'family')),
('äiti',          'mother',                              48,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'family')),
('isä',           'father',                              50,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'family')),
('lapsi',         'child',                               55,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'family')),
('poika',         'boy / son',                           58,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'family')),
('tyttö',         'girl / daughter',                     60,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'family')),
('veli',          'brother',                             62,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'family')),
('sisar',         'sister',                              64,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'family')),
('isovanhempi',   'grandparent',                        68,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'family')),
('isoäiti',       'grandmother',                        70,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'family')),
('isoisä',        'grandfather',                        72,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'family')),
('ystävä',        'friend',                              75,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'family')),
('tuttava',       'acquaintance',                       280, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'family')),
('nainen',        'woman',                               80,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'family')),
('mies',          'man',                                 78,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'family')),
('ihminen',       'person / human being',                85,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'family')),
('tyttöystävä',   'girlfriend',                         285, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'family')),
('poikaystävä',   'boyfriend',                          288, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'family')),
('puoliso',       'spouse / partner',                   290, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'family')),
('naapuri',       'neighbour',                          295, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'family')),

-- ============================================================
-- HOME & HOUSING (topic slug: home)
-- ============================================================
('talo',          'house / building',                    90,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'home')),
('asunto',        'apartment / flat',                    95,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'home')),
('huone',         'room',                                98,  'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'home')),
('keittiö',       'kitchen',                            100, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'home')),
('makuuhuone',    'bedroom',                            102, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'home')),
('olohuone',      'living room',                        104, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'home')),
('kylpyhuone',    'bathroom',                           106, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'home')),
('ovi',           'door',                               108, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'home')),
('ikkuna',        'window',                             110, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'home')),
('lattia',        'floor',                              112, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'home')),
('katto',         'ceiling / roof',                     114, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'home')),
('seinä',         'wall',                               116, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'home')),
('pöytä',         'table',                              118, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'home')),
('tuoli',         'chair',                              120, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'home')),
('sohva',         'sofa / couch',                       122, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'home')),
('vuode',         'bed',                                124, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'home')),
('kaappi',        'cupboard / wardrobe',                300, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'home')),
('hissi',         'lift / elevator',                    302, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'home')),
('portaat',       'stairs',                             304, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'home')),
('kerros',        'floor / storey',                     306, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'home')),

-- ============================================================
-- FOOD & DRINK (topic slug: food_drink)
-- ============================================================
('ruoka',         'food',                               130, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'food_drink')),
('juoma',         'drink / beverage',                   132, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'food_drink')),
('vesi',          'water',                              134, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'food_drink')),
('maito',         'milk',                               136, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'food_drink')),
('kahvi',         'coffee',                             138, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'food_drink')),
('tee',           'tea',                                140, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'food_drink')),
('mehu',          'juice',                              142, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'food_drink')),
('leipä',         'bread',                              144, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'food_drink')),
('voi',           'butter',                             146, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'food_drink')),
('juusto',        'cheese',                             148, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'food_drink')),
('liha',          'meat',                               150, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'food_drink')),
('kala',          'fish',                               152, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'food_drink')),
('kana',          'chicken',                            154, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'food_drink')),
('muna',          'egg',                                156, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'food_drink')),
('peruna',        'potato',                             158, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'food_drink')),
('riisi',         'rice',                               160, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'food_drink')),
('pasta',         'pasta',                              162, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'food_drink')),
('keitto',        'soup',                               164, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'food_drink')),
('salaatti',      'salad',                              310, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'food_drink')),
('hedelma',       'fruit',                              312, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'food_drink')),

-- ============================================================
-- SHOPPING (topic slug: shopping)
-- ============================================================
('kauppa',        'shop / store',                       170, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'shopping')),
('hinta',         'price',                              172, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'shopping')),
('euro',          'euro',                               174, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'shopping')),
('sentti',        'cent',                               176, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'shopping')),
('ostaa',         'to buy',                             178, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'shopping')),
('myydä',         'to sell',                            180, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'shopping')),
('maksaa',        'to pay / to cost',                   182, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'shopping')),
('kortti',        'card',                               184, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'shopping')),
('käteinen',      'cash',                               320, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'shopping')),
('kuitti',        'receipt',                            322, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'shopping')),
('alennus',       'discount',                           324, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'shopping')),
('kassa',         'checkout / cashier',                 326, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'shopping')),
('vaate',         'clothing / garment',                 328, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'shopping')),
('koko',          'size',                               186, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'shopping')),
('väri',          'colour',                             188, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'shopping')),
('pussi',         'bag',                                190, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'shopping')),
('paljon',        'a lot / much',                        16,  'A1', 'adverb',      (SELECT id FROM topics WHERE slug = 'shopping')),
('vähän',         'a little / some',                    17,  'A1', 'adverb',      (SELECT id FROM topics WHERE slug = 'shopping')),
('kallista',      'expensive (partitive)',              330, 'A2', 'adjective',   (SELECT id FROM topics WHERE slug = 'shopping')),
('halpaa',        'cheap (partitive)',                  332, 'A2', 'adjective',   (SELECT id FROM topics WHERE slug = 'shopping')),

-- ============================================================
-- DAILY ROUTINES & FREE TIME (topic slug: daily_routines)
-- ============================================================
('aamu',          'morning',                            195, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'daily_routines')),
('ilta',          'evening',                            197, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'daily_routines')),
('yö',            'night',                              199, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'daily_routines')),
('päivä',         'day',                                201, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'daily_routines')),
('aika',          'time',                               203, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'daily_routines')),
('tunti',         'hour',                               205, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'daily_routines')),
('viikko',        'week',                               207, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'daily_routines')),
('kuukausi',      'month',                              209, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'daily_routines')),
('vuosi',         'year',                               211, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'daily_routines')),
('nyt',           'now',                                 9,   'A1', 'adverb',      (SELECT id FROM topics WHERE slug = 'daily_routines')),
('tänään',        'today',                              213, 'A1', 'adverb',      (SELECT id FROM topics WHERE slug = 'daily_routines')),
('huomenna',      'tomorrow',                           215, 'A1', 'adverb',      (SELECT id FROM topics WHERE slug = 'daily_routines')),
('eilen',         'yesterday',                          217, 'A1', 'adverb',      (SELECT id FROM topics WHERE slug = 'daily_routines')),
('herääminen',    'waking up',                          335, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'daily_routines')),
('nukkua',        'to sleep',                           219, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'daily_routines')),
('syödä',         'to eat',                             221, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'daily_routines')),
('juoda',         'to drink',                           223, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'daily_routines')),
('käydä',         'to go / to visit',                   225, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'daily_routines')),
('mennä',         'to go',                               7,   'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'daily_routines')),
('tulla',         'to come',                            14,  'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'daily_routines')),

-- ============================================================
-- HEALTH & HEALTHCARE (topic slug: health)
-- ============================================================
('lääkäri',       'doctor',                             230, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'health')),
('sairaala',      'hospital',                           232, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'health')),
('apteekki',      'pharmacy',                           234, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'health')),
('lääke',         'medicine',                           236, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'health')),
('kipu',          'pain',                               238, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'health')),
('kuume',         'fever',                              240, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'health')),
('päänsärky',     'headache',                           242, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'health')),
('yskä',          'cough',                              244, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'health')),
('vatsakipu',     'stomach ache',                       340, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'health')),
('allergia',      'allergy',                            342, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'health')),
('resepti',       'prescription',                       344, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'health')),
('terveys',       'health',                             246, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'health')),
('terve',         'healthy',                            248, 'A1', 'adjective',   (SELECT id FROM topics WHERE slug = 'health')),
('sairas',        'ill / sick',                         250, 'A1', 'adjective',   (SELECT id FROM topics WHERE slug = 'health')),
('voida',         'to be able to / to feel',            19,  'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'health')),
('sattua',        'to hurt / to happen',                346, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'health')),
('parantua',      'to recover / to get better',        348, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'health')),
('ajanvaraus',    'appointment',                        350, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'health')),
('hoitaja',       'nurse / carer',                      352, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'health')),
('hammaslääkäri', 'dentist',                            354, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'health')),

-- ============================================================
-- TRANSPORT & TRAVEL (topic slug: transport)
-- ============================================================
('bussi',         'bus',                                252, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'transport')),
('juna',          'train',                              254, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'transport')),
('auto',          'car',                                256, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'transport')),
('lentokone',     'aeroplane',                          258, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'transport')),
('metro',         'metro / underground',                260, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'transport')),
('raitiovaunu',   'tram',                               356, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'transport')),
('taksi',         'taxi',                               358, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'transport')),
('asema',         'station',                            262, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'transport')),
('lentokenttä',   'airport',                            264, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'transport')),
('lippu',         'ticket',                             266, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'transport')),
('aikataulu',     'timetable / schedule',               360, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'transport')),
('lähtö',         'departure',                          362, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'transport')),
('saapuminen',    'arrival',                            364, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'transport')),
('matkustaa',     'to travel',                          268, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'transport')),
('ajaa',          'to drive / to ride',                 270, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'transport')),
('lentää',        'to fly',                             272, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'transport')),
('kävellä',       'to walk',                            274, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'transport')),
('pysäkki',       'stop (bus/tram)',                    366, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'transport')),
('vaihto',        'transfer / change',                  368, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'transport')),
('reitti',        'route',                              370, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'transport')),

-- ============================================================
-- WEATHER & SEASONS (topic slug: weather)
-- ============================================================
('sää',           'weather',                            276, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'weather')),
('aurinko',       'sun',                                278, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'weather')),
('pilvi',         'cloud',                              280, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'weather')),
('sade',          'rain',                               282, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'weather')),
('lumi',          'snow',                               284, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'weather')),
('tuuli',         'wind',                               286, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'weather')),
('pakkanen',      'frost / freezing temperature',       372, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'weather')),
('lämpötila',     'temperature',                        374, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'weather')),
('kesä',          'summer',                             288, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'weather')),
('talvi',         'winter',                             290, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'weather')),
('kevät',         'spring',                             292, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'weather')),
('syksy',         'autumn',                             294, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'weather')),
('lämmin',        'warm',                               296, 'A1', 'adjective',   (SELECT id FROM topics WHERE slug = 'weather')),
('kylmä',         'cold',                               298, 'A1', 'adjective',   (SELECT id FROM topics WHERE slug = 'weather')),
('sataa',         'it rains / it snows',                376, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'weather')),
('paistaa',       'to shine',                           378, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'weather')),
('tuulla',        'to be windy',                        380, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'weather')),
('pilvinen',      'cloudy',                             382, 'A2', 'adjective',   (SELECT id FROM topics WHERE slug = 'weather')),
('aurinkoinen',   'sunny',                              384, 'A2', 'adjective',   (SELECT id FROM topics WHERE slug = 'weather')),
('sateinen',      'rainy',                              386, 'A2', 'adjective',   (SELECT id FROM topics WHERE slug = 'weather')),

-- ============================================================
-- HOBBIES & SPORTS (topic slug: hobbies)
-- ============================================================
('harrastus',     'hobby',                              388, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'hobbies')),
('urheilu',       'sport / exercise',                   390, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'hobbies')),
('musiikki',      'music',                              392, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'hobbies')),
('kirja',         'book',                               300, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'hobbies')),
('elokuva',       'film / movie',                       302, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'hobbies')),
('pelata',        'to play (games/sports)',              304, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'hobbies')),
('lukea',         'to read',                            306, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'hobbies')),
('katsoa',        'to watch / to look',                 308, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'hobbies')),
('kuunnella',     'to listen',                          310, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'hobbies')),
('laulaa',        'to sing',                            394, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'hobbies')),
('piirtää',       'to draw',                            396, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'hobbies')),
('uida',          'to swim',                            312, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'hobbies')),
('juosta',        'to run',                             314, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'hobbies')),
('jalkapallo',    'football / soccer',                  398, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'hobbies')),
('hiihto',        'skiing',                             400, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'hobbies')),
('tanssi',        'dance',                              402, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'hobbies')),
('retkeillä',     'to go hiking',                       404, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'hobbies')),
('pelikortti',    'playing card',                       406, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'hobbies')),
('valokuva',      'photograph',                         408, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'hobbies')),
('teatteri',      'theatre',                            410, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'hobbies')),

-- ============================================================
-- EVENTS & CELEBRATIONS (topic slug: events)
-- ============================================================
('juhla',         'celebration / party',                316, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'events')),
('syntymäpäivä',  'birthday',                           318, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'events')),
('joulu',         'Christmas',                          320, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'events')),
('juhannus',      'Midsummer',                          412, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'events')),
('vappu',         'May Day / 1st of May',               414, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'events')),
('lahja',         'gift',                               322, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'events')),
('kutsu',         'invitation',                         416, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'events')),
('juhlia',        'to celebrate',                       418, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'events')),
('toivottaa',     'to wish',                            420, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'events')),
('onnea',         'congratulations / good luck',        324, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'events')),
('saunailtaa',    'sauna evening',                      422, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'events')),
('kokous',        'meeting',                            424, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'events')),
('häät',          'wedding',                            426, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'events')),
('hautajaiset',   'funeral',                            428, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'events')),
('pääsiäinen',    'Easter',                             430, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'events')),
('konsertti',     'concert',                            326, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'events')),
('festivaali',    'festival',                           432, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'events')),
('tarjota',       'to offer / to treat',                434, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'events')),
('kutsua',        'to invite',                          436, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'events')),
('iloisesti',     'joyfully',                           438, 'A2', 'adverb',      (SELECT id FROM topics WHERE slug = 'events')),

-- ============================================================
-- WORK & PROFESSION (topic slug: work_general)
-- ============================================================
('työ',           'work / job',                         328, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'work_general')),
('ammatti',       'profession / occupation',            330, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'work_general')),
('palkka',        'salary / wage',                      440, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'work_general')),
('työsopimus',    'employment contract',                442, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'work_general')),
('esimies',       'supervisor / boss',                  444, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'work_general')),
('tehdä',         'to do / to make',                    23,  'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'work_general')),
('työskennellä',  'to work (ongoing)',                  446, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'work_general')),
('palkata',       'to hire',                            448, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'work_general')),
('irtisanoa',     'to dismiss / to quit',               450, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'work_general')),
('lomauttaa',     'to lay off temporarily',             452, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'work_general')),
('loma',          'holiday / leave',                    332, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'work_general')),
('sairasloma',    'sick leave',                         454, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'work_general')),
('työtunnit',     'working hours',                      456, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'work_general')),
('ylityö',        'overtime',                           458, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'work_general')),
('eläke',         'pension',                            460, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'work_general')),
('toimisto',      'office',                             334, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'work_general')),
('kokous',        'meeting',                            336, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'work_general')),
('projekti',      'project',                            462, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'work_general')),
('tavoite',       'goal / target',                      464, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'work_general')),
('koulutus',      'training / education',               466, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'work_general')),

-- ============================================================
-- WORKPLACE & COLLEAGUES (topic slug: workplace)
-- ============================================================
('työkaveri',     'colleague / workmate',               338, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'workplace')),
('tiimi',         'team',                               468, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'workplace')),
('osasto',        'department',                         470, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'workplace')),
('johtaja',       'manager / director',                 472, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'workplace')),
('neuvottelu',    'negotiation / meeting',              474, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'workplace')),
('sähköposti',    'email',                              340, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'workplace')),
('raportti',      'report',                             476, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'workplace')),
('aikatauluttaa', 'to schedule',                        478, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'workplace')),
('ilmoittaa',     'to inform / to announce',            480, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'workplace')),
('vahvistaa',     'to confirm',                         482, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'workplace')),

-- ============================================================
-- JOB SEEKING & CV (topic slug: job_search)
-- ============================================================
('hakemus',       'application',                        342, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'job_search')),
('ansioluettelo', 'CV / résumé',                        484, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'job_search')),
('haastattelu',   'interview',                          344, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'job_search')),
('hakea',         'to apply / to search',               346, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'job_search')),
('kokemus',       'experience',                         486, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'job_search')),
('taito',         'skill',                              488, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'job_search')),
('suositus',      'recommendation',                     490, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'job_search')),
('työpaikka',     'workplace / job position',           348, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'job_search')),
('työnantaja',    'employer',                           492, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'job_search')),
('TE-toimisto',   'employment office (TE-palvelut)',    494, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'job_search')),

-- ============================================================
-- EDUCATION & STUDY (topic slug: education)
-- ============================================================
('koulu',         'school',                             350, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'education')),
('yliopisto',     'university',                         352, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'education')),
('opiskelija',    'student',                            354, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'education')),
('opettaja',      'teacher',                            356, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'education')),
('luokka',        'classroom / class',                  358, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'education')),
('kirja',         'book',                               360, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'education')),
('oppia',         'to learn',                           362, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'education')),
('opiskella',     'to study',                           364, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'education')),
('tutkinto',      'degree / qualification',             496, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'education')),
('tentti',        'exam',                               498, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'education')),

-- ============================================================
-- TECHNOLOGY & DIGITAL LIFE (topic slug: technology)
-- ============================================================
('puhelin',       'telephone / phone',                  366, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'technology')),
('tietokone',     'computer',                           368, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'technology')),
('internet',      'internet',                           370, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'technology')),
('sovellus',      'application / app',                  500, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'technology')),
('salasana',      'password',                           372, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'technology')),
('ladata',        'to download / to charge',            374, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'technology')),
('lähettää',      'to send',                            376, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'technology')),
('sosiaalinen media', 'social media',                   502, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'technology')),
('verkkosivusto', 'website',                            504, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'technology')),
('wifi',          'wifi',                               378, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'technology')),

-- ============================================================
-- BANKING & MONEY (topic slug: banking)
-- ============================================================
('pankki',        'bank',                               380, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'banking')),
('tili',          'account',                            382, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'banking')),
('raha',          'money',                              384, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'banking')),
('nostaa',        'to withdraw',                        506, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'banking')),
('siirtää',       'to transfer',                        508, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'banking')),
('lasku',         'bill / invoice',                     386, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'banking')),
('luottokortti',  'credit card',                        510, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'banking')),
('pankkitunnukset', 'bank login credentials',           512, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'banking')),
('verkkopankki',  'online banking',                     514, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'banking')),
('viite',         'reference number',                   388, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'banking')),

-- ============================================================
-- POST & PARCELS (topic slug: post_office)
-- ============================================================
('kirje',         'letter',                             390, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'post_office')),
('paketti',       'parcel / package',                   392, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'post_office')),
('postimerkki',   'stamp',                              516, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'post_office')),
('osoite',        'address',                            394, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'post_office')),
('postinumero',   'postcode / zip code',                518, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'post_office')),
('lähettää',      'to send',                            396, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'post_office')),
('noutaa',        'to pick up / to collect',            520, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'post_office')),
('pakettiluukku', 'parcel locker',                      522, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'post_office')),
('kuori',         'envelope',                           398, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'post_office')),
('noutoilmoitus', 'collection notice',                  524, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'post_office')),

-- ============================================================
-- HOUSING SERVICES & OFFICIALS (topic slug: housing_services)
-- ============================================================
('vuokra',        'rent',                               400, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'housing_services')),
('vuokranantaja', 'landlord',                           526, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'housing_services')),
('vuokralainen',  'tenant',                             528, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'housing_services')),
('sopimus',       'contract / agreement',               530, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'housing_services')),
('isännöitsijä',  'property manager',                   532, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'housing_services')),
('korjaus',       'repair',                             534, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'housing_services')),
('muuttaa',       'to move (house)',                    402, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'housing_services')),
('vuokrata',      'to rent',                            536, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'housing_services')),
('Kela',          'Social Insurance Institution',       404, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'housing_services')),
('asumistuki',    'housing allowance',                  538, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'housing_services')),

-- ============================================================
-- EMERGENCIES & SAFETY (topic slug: emergency)
-- ============================================================
('hätänumero',    'emergency number',                   406, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'emergency')),
('poliisi',       'police',                             408, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'emergency')),
('palokunta',     'fire brigade',                       540, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'emergency')),
('ambulanssi',    'ambulance',                          542, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'emergency')),
('apua',          'help (partitive)',                   410, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'emergency')),
('vaara',         'danger',                             412, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'emergency')),
('tulipalo',      'fire (incident)',                    544, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'emergency')),
('onnettomuus',   'accident',                           546, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'emergency')),
('soittaa',       'to call / to phone',                 414, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'emergency')),
('pelastaa',      'to rescue / to save',                548, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'emergency')),

-- ============================================================
-- CITY LIFE & ENVIRONMENT (topic slug: city_life)
-- ============================================================
('kaupunki',      'city / town',                        416, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'city_life')),
('katu',          'street',                             418, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'city_life')),
('puisto',        'park',                               420, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'city_life')),
('kirjasto',      'library',                            422, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'city_life')),
('ravintola',     'restaurant',                         424, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'city_life')),
('kahvila',       'café',                               426, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'city_life')),
('hotelli',       'hotel',                              428, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'city_life')),
('museo',         'museum',                             550, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'city_life')),
('uimahalli',     'indoor swimming pool',               552, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'city_life')),
('ympäristö',     'environment',                        554, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'city_life')),

-- ============================================================
-- MEDIA & NEWS (topic slug: media_news)
-- ============================================================
('uutiset',       'news',                               430, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'media_news')),
('televisio',     'television',                         432, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'media_news')),
('radio',         'radio',                              434, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'media_news')),
('lehti',         'newspaper / magazine',               436, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'media_news')),
('artikkeli',     'article',                            556, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'media_news')),
('toimittaja',    'journalist',                         558, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'media_news')),
('julkaista',     'to publish',                         560, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'media_news')),
('kommentoida',   'to comment',                         562, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'media_news')),
('jakaa',         'to share',                           438, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'media_news')),
('podcast',       'podcast',                            564, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'media_news')),

-- ============================================================
-- INTEGRATION & CULTURE (topic slug: integration)
-- ============================================================
('kotouttaminen', 'integration',                        566, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'integration')),
('kotoutumissuunnitelma', 'integration plan',           568, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'integration')),
('kulttuuri',     'culture',                            440, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'integration')),
('kieli',         'language',                           442, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'integration')),
('suomi',         'Finnish (language/country)',         444, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'integration')),
('englanti',      'English (language)',                 446, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'integration')),
('käytäntö',      'practice / custom',                  570, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'integration')),
('tapa',          'habit / way / custom',               572, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'integration')),
('juhlapäivä',    'public holiday',                     574, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'integration')),
('perinne',       'tradition',                          576, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'integration')),

-- ============================================================
-- RIGHTS & DUTIES (topic slug: rights_duties)
-- ============================================================
('oikeus',        'right / law',                        448, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'rights_duties')),
('velvollisuus',  'duty / obligation',                  578, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'rights_duties')),
('laki',          'law / legislation',                  450, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'rights_duties')),
('passi',         'passport',                           452, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'rights_duties')),
('henkilökortti', 'identity card',                      580, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'rights_duties')),
('oleskelulupa',  'residence permit',                   582, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'rights_duties')),
('äänestää',      'to vote',                            584, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'rights_duties')),
('ilmoittaa',     'to register / to report',            586, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'rights_duties')),
('verotus',       'taxation',                           588, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'rights_duties')),
('viranomainen',  'authority / official',               590, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'rights_duties')),

-- ============================================================
-- YKI EXAM PREPARATION (topic slug: yki_exam_prep)
-- ============================================================
('kuullunymmärtäminen', 'listening comprehension',      454, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
('luetun ymmärtäminen', 'reading comprehension',        456, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
('kirjoittaminen', 'writing',                           458, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
('puhuminen',     'speaking',                           460, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
('arviointi',     'assessment / evaluation',            592, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
('koe',           'test / exam',                        462, 'A1', 'noun',        (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
('harjoitella',   'to practise',                        594, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
('ymmärtää',      'to understand',                      464, 'A1', 'verb',        (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
('vastata',       'to answer',                          596, 'A2', 'verb',        (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
('tulos',         'result',                             598, 'A2', 'noun',        (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),

-- ============================================================
-- HIGH-FREQUENCY CORE WORDS (distributed across topics)
-- ============================================================
('olla',          'to be',                               4,   'A1', 'verb',        NULL),
('ei',            'no / not',                            26,  'A1', 'particle',    NULL),
('ja',            'and',                                 28,  'A1', 'conjunction', NULL),
('tai',           'or',                                  32,  'A1', 'conjunction', NULL),
('mutta',         'but',                                 34,  'A1', 'conjunction', NULL),
('koska',         'because',                             36,  'A1', 'conjunction', NULL),
('jos',           'if',                                  38,  'A1', 'conjunction', NULL),
('kun',           'when / as',                           42,  'A1', 'conjunction', NULL),
('että',          'that (conjunction)',                  44,  'A1', 'conjunction', NULL),
('kaikki',        'all / everyone / everything',         46,  'A1', 'pronoun',     NULL),
('joku',          'someone',                             52,  'A1', 'pronoun',     NULL),
('jokin',         'something',                           54,  'A1', 'pronoun',     NULL),
('mitä',          'what (partitive)',                    56,  'A1', 'pronoun',     NULL),
('mikä',          'what / which',                        57,  'A1', 'pronoun',     NULL),
('kuka',          'who',                                 59,  'A1', 'pronoun',     NULL),
('missä',         'where (inessive)',                    61,  'A1', 'adverb',      NULL),
('minne',         'where to',                            63,  'A1', 'adverb',      NULL),
('mistä',         'from where',                         65,  'A1', 'adverb',      NULL),
('milloin',       'when',                               66,  'A1', 'adverb',      NULL),
('miksi',         'why',                                 67,  'A1', 'adverb',      NULL),
('miten',         'how',                                 69,  'A1', 'adverb',      NULL),
('kuinka',        'how much / how many',                 71,  'A1', 'adverb',      NULL),
('hyvin',         'well / very',                         73,  'A1', 'adverb',      NULL),
('hyva',          'good',                                74,  'A1', 'adjective',   NULL),
('iso',           'big / large',                         76,  'A1', 'adjective',   NULL),
('pieni',         'small',                               77,  'A1', 'adjective',   NULL),
('uusi',          'new',                                 79,  'A1', 'adjective',   NULL),
('vanha',         'old',                                 81,  'A1', 'adjective',   NULL),
('pitkä',         'long / tall',                         83,  'A1', 'adjective',   NULL),
('lyhyt',         'short',                               84,  'A1', 'adjective',   NULL),
('nopea',         'fast / quick',                        86,  'A1', 'adjective',   NULL),
('hidas',         'slow',                                87,  'A1', 'adjective',   NULL),
('kaunis',        'beautiful / pretty',                  88,  'A1', 'adjective',   NULL),
('huono',         'bad / poor',                          89,  'A1', 'adjective',   NULL),
('kallis',        'expensive',                           91,  'A1', 'adjective',   NULL),
('halpa',         'cheap',                               92,  'A1', 'adjective',   NULL),
('vahva',         'strong',                              93,  'A1', 'adjective',   NULL),
('heikko',        'weak',                                94,  'A1', 'adjective',   NULL),
('avoin',         'open',                                96,  'A1', 'adjective',   NULL),
('suljettu',      'closed',                              97,  'A1', 'adjective',   NULL),
('täynnä',        'full',                                99,  'A1', 'adjective',   NULL),
('tyhjä',         'empty',                              101, 'A1', 'adjective',   NULL),
('helppo',        'easy',                               103, 'A1', 'adjective',   NULL),
('vaikea',        'difficult',                          105, 'A1', 'adjective',   NULL),
('tärkeä',        'important',                          107, 'A1', 'adjective',   NULL),
('hauska',        'fun / amusing',                      109, 'A1', 'adjective',   NULL),
('surullinen',    'sad',                                111, 'A1', 'adjective',   NULL),
('iloinen',       'happy',                              113, 'A1', 'adjective',   NULL),
('väsynyt',       'tired',                              115, 'A1', 'adjective',   NULL),
('nälkäinen',     'hungry',                             117, 'A1', 'adjective',   NULL),
('janoinen',      'thirsty',                            119, 'A1', 'adjective',   NULL),
('nuori',         'young',                              121, 'A1', 'adjective',   NULL),
('oikea',         'right / correct',                    123, 'A1', 'adjective',   NULL),
('väärä',         'wrong',                              125, 'A1', 'adjective',   NULL),
('sama',          'same',                               127, 'A1', 'adjective',   NULL),
('eri',           'different',                          129, 'A1', 'adjective',   NULL),
('meri',          'sea',                                131, 'A1', 'noun',        NULL),
('järvi',         'lake',                               133, 'A1', 'noun',        NULL),
('metsä',         'forest',                             135, 'A1', 'noun',        NULL),
('lämpö',         'warmth / heat',                      137, 'A1', 'noun',        NULL),
('numero',        'number',                             139, 'A1', 'noun',        NULL),
('yksi',          'one',                                141, 'A1', 'numeral',     NULL),
('kaksi',         'two',                                143, 'A1', 'numeral',     NULL),
('kolme',         'three',                              145, 'A1', 'numeral',     NULL),
('neljä',         'four',                               147, 'A1', 'numeral',     NULL),
('viisi',         'five',                               149, 'A1', 'numeral',     NULL),
('kuusi',         'six',                                151, 'A1', 'numeral',     NULL),
('seitsemän',     'seven',                              153, 'A1', 'numeral',     NULL),
('kahdeksan',     'eight',                              155, 'A1', 'numeral',     NULL),
('yhdeksän',      'nine',                               157, 'A1', 'numeral',     NULL),
('kymmenen',      'ten',                                159, 'A1', 'numeral',     NULL),
('sata',          'hundred',                            161, 'A1', 'numeral',     NULL),
('tuhat',         'thousand',                           163, 'A1', 'numeral',     NULL),
('ensimmäinen',   'first',                              165, 'A1', 'numeral',     NULL),
('toinen',        'second / another',                   167, 'A1', 'numeral',     NULL),
('kolmas',        'third',                              169, 'A1', 'numeral',     NULL),
('antaa',         'to give',                            171, 'A1', 'verb',        NULL),
('ottaa',         'to take',                            173, 'A1', 'verb',        NULL),
('saada',         'to get / to receive',                175, 'A1', 'verb',        NULL),
('tarvita',       'to need',                            177, 'A1', 'verb',        NULL),
('haluta',        'to want',                            179, 'A1', 'verb',        NULL),
('pitää',         'to like / to hold / must',           181, 'A1', 'verb',        NULL),
('täytyä',        'to have to / must',                  183, 'A1', 'verb',        NULL),
('pitää tehdä',   'to have to do',                      185, 'A1', 'verb',        NULL),
('voida',         'to be able to / can',                187, 'A1', 'verb',        NULL),
('löytää',        'to find',                            189, 'A1', 'verb',        NULL),
('tietää',        'to know (a fact)',                   191, 'A1', 'verb',        NULL),
('kysyä',         'to ask',                             193, 'A1', 'verb',        NULL),
('kertoa',        'to tell',                            196, 'A1', 'verb',        NULL),
('nähdä',         'to see',                             198, 'A1', 'verb',        NULL),
('kuulla',        'to hear',                            200, 'A1', 'verb',        NULL),
('sanoa',         'to say',                             202, 'A1', 'verb',        NULL),
('kirjoittaa',    'to write',                           204, 'A1', 'verb',        NULL),
('puhua',         'to speak',                           206, 'A1', 'verb',        NULL),
('ymmärtää',      'to understand',                      208, 'A1', 'verb',        NULL),
('oppia',         'to learn',                           210, 'A1', 'verb',        NULL),
('tulla toimeen', 'to get along / to manage',           212, 'A1', 'verb',        NULL),
('asua',          'to live / to reside',                214, 'A1', 'verb',        NULL),
('käyttää',       'to use',                             216, 'A1', 'verb',        NULL),
('avata',         'to open',                            218, 'A1', 'verb',        NULL),
('sulkea',        'to close',                           220, 'A1', 'verb',        NULL),
('odottaa',       'to wait',                            222, 'A1', 'verb',        NULL),
('auttaa',        'to help',                            224, 'A1', 'verb',        NULL),
('palata',        'to return',                          226, 'A1', 'verb',        NULL),
('lähteä',        'to leave / to depart',               228, 'A1', 'verb',        NULL),
('jäädä',         'to stay / to remain',                600, 'A2', 'verb',        NULL),
('kokeilla',      'to try / to test',                   602, 'A2', 'verb',        NULL),
('muistaa',       'to remember',                        604, 'A2', 'verb',        NULL),
('unohtaa',       'to forget',                          606, 'A2', 'verb',        NULL),
('maksaa',        'to cost / to pay',                   608, 'A2', 'verb',        NULL),
('toimia',        'to function / to act',               610, 'A2', 'verb',        NULL),
('kuulua',        'to belong to',                       612, 'A2', 'verb',        NULL),
('riittää',       'to be enough / to suffice',          614, 'A2', 'verb',        NULL),
('kasvaa',        'to grow',                            616, 'A2', 'verb',        NULL),
('tarkoittaa',    'to mean',                            618, 'A2', 'verb',        NULL),
('mahdollinen',   'possible',                           620, 'A2', 'adjective',   NULL),
('tavallinen',    'ordinary / usual',                   622, 'A2', 'adjective',   NULL),
('erilainen',     'different / varied',                 624, 'A2', 'adjective',   NULL),
('erityinen',     'special / particular',               626, 'A2', 'adjective',   NULL),
('yhteinen',      'common / shared',                    628, 'A2', 'adjective',   NULL),
('viime',         'last (week/year)',                   630, 'A2', 'adjective',   NULL),
('seuraava',      'next / following',                   632, 'A2', 'adjective',   NULL),
('ainoa',         'only / sole',                        634, 'A2', 'adjective',   NULL),
('myöhemmin',     'later',                              636, 'A2', 'adverb',      NULL),
('aikaisemmin',   'earlier',                            638, 'A2', 'adverb',      NULL),
('usein',         'often',                              640, 'A2', 'adverb',      NULL),
('harvoin',       'rarely',                             642, 'A2', 'adverb',      NULL),
('aina',          'always',                             644, 'A2', 'adverb',      NULL),
('koskaan',       'ever / never (with negation)',       646, 'A2', 'adverb',      NULL),
('jo',            'already',                            648, 'A2', 'adverb',      NULL),
('vielä',         'still / yet',                        650, 'A2', 'adverb',      NULL),
('enemmän',       'more',                               652, 'A2', 'adverb',      NULL),
('vähemmän',      'less',                               654, 'A2', 'adverb',      NULL),
('liian',         'too (much)',                         656, 'A2', 'adverb',      NULL),
('tarpeeksi',     'enough',                             658, 'A2', 'adverb',      NULL),
('yhdessä',       'together',                           660, 'A2', 'adverb',      NULL),
('yksin',         'alone',                              662, 'A2', 'adverb',      NULL),
('vastaan',       'against / toward',                   664, 'A2', 'preposition', NULL),
('ilman',         'without',                            666, 'A2', 'preposition', NULL),
('kanssa',        'with (together with)',               668, 'A2', 'preposition', NULL),
('kautta',        'through / via',                      670, 'A2', 'preposition', NULL),
('ennen',         'before',                             672, 'A2', 'preposition', NULL),
('jälkeen',       'after',                              674, 'A2', 'preposition', NULL),
('aikana',        'during',                             676, 'A2', 'preposition', NULL),
('takia',         'because of',                         678, 'A2', 'preposition', NULL),
('mukaan',        'according to / along',               680, 'A2', 'preposition', NULL),
('puolesta',      'on behalf of',                       682, 'A2', 'preposition', NULL),
('koiran',        'of the dog (genitive)',              684, 'A2', 'noun',        NULL),
('koira',         'dog',                                686, 'A2', 'noun',        NULL),
('kissa',         'cat',                                688, 'A2', 'noun',        NULL),
('lintu',         'bird',                               690, 'A2', 'noun',        NULL),
('puu',           'tree / wood',                        692, 'A2', 'noun',        NULL),
('kukka',         'flower',                             694, 'A2', 'noun',        NULL),
('väri',          'colour',                             696, 'A2', 'noun',        NULL),
('punainen',      'red',                                698, 'A2', 'adjective',   NULL),
('sininen',       'blue',                               700, 'A2', 'adjective',   NULL),
('vihreä',        'green',                              702, 'A2', 'adjective',   NULL),
('keltainen',     'yellow',                             704, 'A2', 'adjective',   NULL),
('musta',         'black',                              706, 'A2', 'adjective',   NULL),
('valkoinen',     'white',                              708, 'A2', 'adjective',   NULL),
('harmaa',        'grey',                               710, 'A2', 'adjective',   NULL),
('ruskea',        'brown',                              712, 'A2', 'adjective',   NULL),
('oranssi',       'orange',                             714, 'A2', 'adjective',   NULL),
('violetti',      'purple / violet',                    716, 'A2', 'adjective',   NULL),
('vaaleanpunainen', 'pink',                             718, 'A2', 'adjective',   NULL),
('tummansiniinen', 'dark blue / navy',                  720, 'A2', 'adjective',   NULL),
('parempi',       'better',                             722, 'A2', 'adjective',   NULL),
('huonompi',      'worse',                              724, 'A2', 'adjective',   NULL),
('isompi',        'bigger',                             726, 'A2', 'adjective',   NULL),
('pienempi',      'smaller',                            728, 'A2', 'adjective',   NULL),
('pidempi',       'longer',                             730, 'A2', 'adjective',   NULL),
('lyhyempi',      'shorter',                            732, 'A2', 'adjective',   NULL),
('nopeampi',      'faster',                             734, 'A2', 'adjective',   NULL),
('hitaampi',      'slower',                             736, 'A2', 'adjective',   NULL),
('halvempi',      'cheaper',                            738, 'A2', 'adjective',   NULL),
('kalliimpi',     'more expensive',                     740, 'A2', 'adjective',   NULL),
('kovempi',       'louder / harder',                    742, 'A2', 'adjective',   NULL),
('hiljaisempi',   'quieter',                            744, 'A2', 'adjective',   NULL),
('lähempänä',     'closer / nearer',                   746, 'A2', 'adjective',   NULL),
('kauempana',     'farther',                            748, 'A2', 'adjective',   NULL),
('kuuma',         'hot',                                750, 'A2', 'adjective',   NULL)

ON CONFLICT (base_form) DO NOTHING;
-- Source: Claude-generated, verified against uusikielemmi.fi puhekieli documentation.
-- Some pairs adapted from Tatoeba Project (tatoeba.org), CC BY 2.0 FR.
-- 25 topics × 20 sentence pairs = 500 sentences.

-- Topic: greetings
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Hyvää huomenta!', 'Hyvää huomenta!', 'Good morning!', 'A1', (SELECT id FROM topics WHERE slug = 'greetings')),
  ('Hyvää päivää!', 'Hyvää päivää!', 'Good day!', 'A1', (SELECT id FROM topics WHERE slug = 'greetings')),
  ('Hyvää iltaa!', 'Hyvää iltaa!', 'Good evening!', 'A1', (SELECT id FROM topics WHERE slug = 'greetings')),
  ('Hei, kuinka voit?', 'Hei, miten menee?', 'Hi, how are you?', 'A1', (SELECT id FROM topics WHERE slug = 'greetings')),
  ('Minä voin hyvin, kiitos.', 'Mä voin hyvin, kiitos.', 'I am doing well, thank you.', 'A1', (SELECT id FROM topics WHERE slug = 'greetings')),
  ('Näkemiin!', 'Moikka!', 'Goodbye!', 'A1', (SELECT id FROM topics WHERE slug = 'greetings')),
  ('Anteeksi, mikä sinun nimesi on?', 'Anteeks, mikä sun nimi on?', 'Excuse me, what is your name?', 'A1', (SELECT id FROM topics WHERE slug = 'greetings')),
  ('Minun nimeni on Maria.', 'Mun nimi on Maria.', 'My name is Maria.', 'A1', (SELECT id FROM topics WHERE slug = 'greetings')),
  ('Hauska tutustua!', 'Hauska tutustuu!', 'Nice to meet you!', 'A1', (SELECT id FROM topics WHERE slug = 'greetings')),
  ('Mistä sinä olet kotoisin?', 'Mistä sä oot kotoisin?', 'Where are you from?', 'A1', (SELECT id FROM topics WHERE slug = 'greetings')),
  ('Olen kotoisin Venäjältä.', 'Oon kotoisin Venäjältä.', 'I am from Russia.', 'A2', (SELECT id FROM topics WHERE slug = 'greetings')),
  ('Puhutko sinä suomea?', 'Puhutko sä suomea?', 'Do you speak Finnish?', 'A2', (SELECT id FROM topics WHERE slug = 'greetings')),
  ('Opiskelen suomea vasta vähän aikaa.', 'Mä oon opiskellu suomee vasta vähän aikaa.', 'I have only been studying Finnish for a short time.', 'A2', (SELECT id FROM topics WHERE slug = 'greetings')),
  ('Voisitko puhua hitaammin?', 'Voisiks sä puhuu hitaammin?', 'Could you speak more slowly?', 'A2', (SELECT id FROM topics WHERE slug = 'greetings')),
  ('En ymmärrä, voisitko toistaa?', 'En ymmärrä, voisiks sä toistaa?', 'I do not understand, could you repeat that?', 'A2', (SELECT id FROM topics WHERE slug = 'greetings')),
  ('Kuinka kauan olet asunut Suomessa?', 'Kuinka kauan sä oot asunu Suomessa?', 'How long have you lived in Finland?', 'A2', (SELECT id FROM topics WHERE slug = 'greetings')),
  ('Olen asunut täällä kuusi kuukautta.', 'Mä oon asunu täällä kuus kuukautta.', 'I have lived here for six months.', 'A2', (SELECT id FROM topics WHERE slug = 'greetings')),
  ('Onko sinulla perhe Suomessa?', 'Onks sul perhe Suomessa?', 'Do you have family in Finland?', 'A2', (SELECT id FROM topics WHERE slug = 'greetings')),
  ('Tavataan huomenna!', 'Tavataan huomenna!', 'See you tomorrow!', 'A2', (SELECT id FROM topics WHERE slug = 'greetings')),
  ('Kiitos, samoin sinulle!', 'Kiitos, samoin!', 'Thank you, same to you!', 'A2', (SELECT id FROM topics WHERE slug = 'greetings'))
ON CONFLICT DO NOTHING;

-- Topic: family
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Minulla on kaksi lasta.', 'Mul on kaks lasta.', 'I have two children.', 'A1', (SELECT id FROM topics WHERE slug = 'family')),
  ('Äitini asuu Helsingissä.', 'Mun äiti asuu Helsingissä.', 'My mother lives in Helsinki.', 'A1', (SELECT id FROM topics WHERE slug = 'family')),
  ('Isäni on lääkäri.', 'Mun isä on lääkäri.', 'My father is a doctor.', 'A1', (SELECT id FROM topics WHERE slug = 'family')),
  ('Minulla on yksi veli.', 'Mul on yks veli.', 'I have one brother.', 'A1', (SELECT id FROM topics WHERE slug = 'family')),
  ('Sisareni on nuorempi kuin minä.', 'Mun sisko on nuorempi ku mä.', 'My sister is younger than me.', 'A1', (SELECT id FROM topics WHERE slug = 'family')),
  ('Perheeni on pieni.', 'Mun perhe on pieni.', 'My family is small.', 'A1', (SELECT id FROM topics WHERE slug = 'family')),
  ('Lapseni käy koulua.', 'Mun lapsi käy kouluu.', 'My child goes to school.', 'A1', (SELECT id FROM topics WHERE slug = 'family')),
  ('Mieheni työskentelee toimistossa.', 'Mun mies työskentelee toimistossa.', 'My husband works in an office.', 'A1', (SELECT id FROM topics WHERE slug = 'family')),
  ('Vaimoni on opettaja.', 'Mun vaimo on opettaja.', 'My wife is a teacher.', 'A1', (SELECT id FROM topics WHERE slug = 'family')),
  ('Isovanhempani asuvat maalla.', 'Mun isovanhemmat asuu maalla.', 'My grandparents live in the countryside.', 'A1', (SELECT id FROM topics WHERE slug = 'family')),
  ('Sukulaiseni asuvat kaukana täältä.', 'Mun sukulaiset asuu kaukana täältä.', 'My relatives live far from here.', 'A2', (SELECT id FROM topics WHERE slug = 'family')),
  ('Käymme yhdessä syömässä joka sunnuntai.', 'Me käydään yhdessä syömässä joka sunnuntai.', 'We go out to eat together every Sunday.', 'A2', (SELECT id FROM topics WHERE slug = 'family')),
  ('Poikani on viisivuotias.', 'Mun poika on viisivuotias.', 'My son is five years old.', 'A2', (SELECT id FROM topics WHERE slug = 'family')),
  ('Tyttäreni aloitti koulun tänä syksynä.', 'Mun tytär aloitti koulun tänä syksynä.', 'My daughter started school this autumn.', 'A2', (SELECT id FROM topics WHERE slug = 'family')),
  ('Pidän yhteyttä perheeseeni videopuheluilla.', 'Mä pidän yhteyttä mun perheeseen videopuheluilla.', 'I keep in touch with my family by video calls.', 'A2', (SELECT id FROM topics WHERE slug = 'family')),
  ('Veljeni muuttaa Suomeen ensi vuonna.', 'Mun veli muuttaa Suomeen ensi vuonna.', 'My brother is moving to Finland next year.', 'A2', (SELECT id FROM topics WHERE slug = 'family')),
  ('Perheemme viettää joulun yhdessä.', 'Meidän perhe viettää joulun yhdessä.', 'Our family spends Christmas together.', 'A2', (SELECT id FROM topics WHERE slug = 'family')),
  ('Lapsemme puhuvat jo suomea koulussa.', 'Meidän lapset puhuu jo suomee koulussa.', 'Our children already speak Finnish at school.', 'A2', (SELECT id FROM topics WHERE slug = 'family')),
  ('Anoppini auttaa lastenhoitamisessa.', 'Mun anoppi auttaa lastenhoitamisessa.', 'My mother-in-law helps with childcare.', 'A2', (SELECT id FROM topics WHERE slug = 'family')),
  ('Meidän perheessä puhutaan kahta kieltä.', 'Meidän perheessä puhutaan kahta kieltä.', 'In our family we speak two languages.', 'A2', (SELECT id FROM topics WHERE slug = 'family'))
ON CONFLICT DO NOTHING;

-- Topic: home
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Asun kaksiossa Tampereella.', 'Mä asun kaksiossa Tampereella.', 'I live in a two-room apartment in Tampere.', 'A1', (SELECT id FROM topics WHERE slug = 'home')),
  ('Keittiö on pieni mutta toimiva.', 'Keittiö on pieni mut toimiva.', 'The kitchen is small but functional.', 'A1', (SELECT id FROM topics WHERE slug = 'home')),
  ('Makuuhuoneessa on iso ikkuna.', 'Makuuhuoneessa on iso ikkuna.', 'The bedroom has a large window.', 'A1', (SELECT id FROM topics WHERE slug = 'home')),
  ('Olohuoneessa on sohva ja televisio.', 'Olohuoneessa on sohva ja televisio.', 'The living room has a sofa and a television.', 'A1', (SELECT id FROM topics WHERE slug = 'home')),
  ('Kylpyhuone on käytävän lopussa.', 'Kylpyhuone on käytävän lopussa.', 'The bathroom is at the end of the hallway.', 'A1', (SELECT id FROM topics WHERE slug = 'home')),
  ('Vuokra maksetaan kuun ensimmäisenä.', 'Vuokra maksetaan kuun ekana.', 'Rent is paid on the first of the month.', 'A1', (SELECT id FROM topics WHERE slug = 'home')),
  ('Pihalla on parkkipaikka.', 'Pihalla on parkkipaikka.', 'There is a parking space in the yard.', 'A1', (SELECT id FROM topics WHERE slug = 'home')),
  ('Naapuri on mukava ihminen.', 'Naapuri on kiva ihminen.', 'The neighbour is a nice person.', 'A1', (SELECT id FROM topics WHERE slug = 'home')),
  ('Ovi lukitaan avaimella.', 'Ovi lukitaan avaimella.', 'The door is locked with a key.', 'A1', (SELECT id FROM topics WHERE slug = 'home')),
  ('Meillä on sauna talossa.', 'Meil on sauna talossa.', 'We have a sauna in the building.', 'A1', (SELECT id FROM topics WHERE slug = 'home')),
  ('Etsin kohtuuhintaista asuntoa kaupungin keskustasta.', 'Mä etsin kohtuuhintasta asuntoo kaupungin keskustasta.', 'I am looking for an affordable apartment in the city centre.', 'A2', (SELECT id FROM topics WHERE slug = 'home')),
  ('Vuokrasopimus on voimassa vuoden loppuun.', 'Vuokrasopimus on voimassa vuoden loppuun.', 'The rental agreement is valid until the end of the year.', 'A2', (SELECT id FROM topics WHERE slug = 'home')),
  ('Taloyhtiöllä on omat säännöt hiljaisuudesta.', 'Taloyhtiöllä on omat säännöt hiljaisuudesta.', 'The housing company has its own rules about quiet hours.', 'A2', (SELECT id FROM topics WHERE slug = 'home')),
  ('Asunnossa on kaukolämmitys.', 'Asunnossa on kaukolämmitys.', 'The apartment has district heating.', 'A2', (SELECT id FROM topics WHERE slug = 'home')),
  ('Pitää ilmoittaa isännöitsijälle vesivuodosta.', 'Pitää ilmottaa isännöitsijälle vesivuodosta.', 'You need to report a water leak to the property manager.', 'A2', (SELECT id FROM topics WHERE slug = 'home')),
  ('Muutimme uuteen asuntoon viime kuussa.', 'Me muutettiin uuteen asuntoon viime kuussa.', 'We moved to a new apartment last month.', 'A2', (SELECT id FROM topics WHERE slug = 'home')),
  ('Vuokra sisältää veden mutta ei sähköä.', 'Vuokra sisältää veden mut ei sähköö.', 'The rent includes water but not electricity.', 'A2', (SELECT id FROM topics WHERE slug = 'home')),
  ('Varastotila on kellarikerroksessa.', 'Varastotila on kellarikerroksessa.', 'The storage space is in the basement.', 'A2', (SELECT id FROM topics WHERE slug = 'home')),
  ('Tein muuttoselvityksen maistraatissa.', 'Mä tein muuttoselvityksen maistraatissa.', 'I completed the change of address at the register office.', 'A2', (SELECT id FROM topics WHERE slug = 'home')),
  ('Asunnon ovi on automaattinen.', 'Asunnon ovi on automaattinen.', 'The apartment building door is automatic.', 'A2', (SELECT id FROM topics WHERE slug = 'home'))
ON CONFLICT DO NOTHING;

-- Topic: food_drink
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Haluaisin kahvin, kiitos.', 'Mä haluisin kahvin, kiitos.', 'I would like a coffee, please.', 'A1', (SELECT id FROM topics WHERE slug = 'food_drink')),
  ('Mikä on tämän päivän lounas?', 'Mikä on tänään lounas?', 'What is today''s lunch special?', 'A1', (SELECT id FROM topics WHERE slug = 'food_drink')),
  ('Otan salaatin ja leivän.', 'Mä otan salaatin ja leivän.', 'I will have the salad and bread.', 'A1', (SELECT id FROM topics WHERE slug = 'food_drink')),
  ('Vesi maistuu hyvältä.', 'Vesi maistuu hyvältä.', 'The water tastes good.', 'A1', (SELECT id FROM topics WHERE slug = 'food_drink')),
  ('Onko teillä kasvisruokaa?', 'Onks teil kasvisruokaa?', 'Do you have vegetarian food?', 'A1', (SELECT id FROM topics WHERE slug = 'food_drink')),
  ('Tämä on maukasta!', 'Tää on tosi hyvää!', 'This is delicious!', 'A1', (SELECT id FROM topics WHERE slug = 'food_drink')),
  ('En syö lihaa.', 'Mä en syö lihaa.', 'I do not eat meat.', 'A1', (SELECT id FROM topics WHERE slug = 'food_drink')),
  ('Juon aamulla teetä.', 'Mä juon aamulla teetä.', 'I drink tea in the morning.', 'A1', (SELECT id FROM topics WHERE slug = 'food_drink')),
  ('Kaupassa on tuoretta leipää.', 'Kaupas on tuoretta leipää.', 'The shop has fresh bread.', 'A1', (SELECT id FROM topics WHERE slug = 'food_drink')),
  ('Lasku, kiitos!', 'Lasku, kiitos!', 'The bill, please!', 'A1', (SELECT id FROM topics WHERE slug = 'food_drink')),
  ('Suomalaiset syövät paljon ruisleipää.', 'Suomalaiset syö paljon ruisleipää.', 'Finns eat a lot of rye bread.', 'A2', (SELECT id FROM topics WHERE slug = 'food_drink')),
  ('Lähikauppa on auki myöhään illalla.', 'Lähikauppa on auki myöhään illalla.', 'The corner shop is open late in the evening.', 'A2', (SELECT id FROM topics WHERE slug = 'food_drink')),
  ('Olen allerginen pähkinöille.', 'Mä oon allerginen pähkinöille.', 'I am allergic to nuts.', 'A2', (SELECT id FROM topics WHERE slug = 'food_drink')),
  ('Voisitteko lämmittää tämän uudelleen?', 'Voisiks te lämmittää tän uudelleen?', 'Could you reheat this?', 'A2', (SELECT id FROM topics WHERE slug = 'food_drink')),
  ('Syön yleensä kotona mutta välillä tilaan ruokaa.', 'Mä syön yleensä kotona mut välillä mä tilaan ruokaa.', 'I usually eat at home but sometimes I order food.', 'A2', (SELECT id FROM topics WHERE slug = 'food_drink')),
  ('Lohikeitto on perinteinen suomalainen ruoka.', 'Lohikeitto on perinteinen suomalainen ruoka.', 'Salmon soup is a traditional Finnish dish.', 'A2', (SELECT id FROM topics WHERE slug = 'food_drink')),
  ('Suomessa kahvinjuonti on hyvin yleistä.', 'Suomessa kahvinjuonti on tosi yleistä.', 'In Finland coffee drinking is very common.', 'A2', (SELECT id FROM topics WHERE slug = 'food_drink')),
  ('Ostimme vihanneksia torilla.', 'Me ostettiin vihanneksia torilla.', 'We bought vegetables at the market.', 'A2', (SELECT id FROM topics WHERE slug = 'food_drink')),
  ('Haluatko lisää ruokaa?', 'Haluuks sä lisää ruokaa?', 'Do you want more food?', 'A2', (SELECT id FROM topics WHERE slug = 'food_drink')),
  ('Ruoka oli erittäin hyvää, kiitos!', 'Ruoka oli tosi hyvää, kiitos!', 'The food was very good, thank you!', 'A2', (SELECT id FROM topics WHERE slug = 'food_drink'))
ON CONFLICT DO NOTHING;

-- Topic: shopping
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Paljonko tämä maksaa?', 'Paljonko tää maksaa?', 'How much does this cost?', 'A1', (SELECT id FROM topics WHERE slug = 'shopping')),
  ('Onko teillä tätä pienempänä?', 'Onks teil tätä pienempänä?', 'Do you have this in a smaller size?', 'A1', (SELECT id FROM topics WHERE slug = 'shopping')),
  ('Maksan kortilla.', 'Mä maksan kortilla.', 'I will pay by card.', 'A1', (SELECT id FROM topics WHERE slug = 'shopping')),
  ('Missä on kassa?', 'Missä on kassa?', 'Where is the checkout?', 'A1', (SELECT id FROM topics WHERE slug = 'shopping')),
  ('Haluaisin palauttaa tämän.', 'Mä haluisin palauttaa tän.', 'I would like to return this.', 'A1', (SELECT id FROM topics WHERE slug = 'shopping')),
  ('Onko teillä alennus?', 'Onks teil alennus?', 'Do you have a discount?', 'A1', (SELECT id FROM topics WHERE slug = 'shopping')),
  ('Tarvitsen kuittia.', 'Mä tarviin kuitin.', 'I need a receipt.', 'A1', (SELECT id FROM topics WHERE slug = 'shopping')),
  ('Kauppa on suljettu sunnuntaisin.', 'Kauppa on kiinni sunnuntaisin.', 'The shop is closed on Sundays.', 'A1', (SELECT id FROM topics WHERE slug = 'shopping')),
  ('Etsin lahjaa ystävälle.', 'Mä etsin lahjaa kaverille.', 'I am looking for a gift for a friend.', 'A1', (SELECT id FROM topics WHERE slug = 'shopping')),
  ('Voinko sovittaa tätä?', 'Voinko mä sovittaa tätä?', 'Can I try this on?', 'A1', (SELECT id FROM topics WHERE slug = 'shopping')),
  ('Tämä tuote on takuun alainen kahden vuoden ajan.', 'Tällä tuotteella on kaks vuotta takuu.', 'This product has a two-year warranty.', 'A2', (SELECT id FROM topics WHERE slug = 'shopping')),
  ('Sovituskopit ovat myymälän takaosassa.', 'Sovituskopit on myymälän takaosassa.', 'The fitting rooms are at the back of the store.', 'A2', (SELECT id FROM topics WHERE slug = 'shopping')),
  ('Haen tilaamani paketin postista.', 'Mä haen tilaamani paketin postista.', 'I am picking up my ordered package from the post office.', 'A2', (SELECT id FROM topics WHERE slug = 'shopping')),
  ('Käytän usein nettikauppaa.', 'Mä käytän usein nettikauppaa.', 'I often use online shopping.', 'A2', (SELECT id FROM topics WHERE slug = 'shopping')),
  ('Tarjous on voimassa ensi viikon loppuun.', 'Tarjous on voimassa ensi viikon loppuun.', 'The offer is valid until the end of next week.', 'A2', (SELECT id FROM topics WHERE slug = 'shopping')),
  ('Tarvitsen uudet talvikengät.', 'Mä tarviin uudet talvikengät.', 'I need new winter boots.', 'A2', (SELECT id FROM topics WHERE slug = 'shopping')),
  ('Ostan ruoat yleensä lähikaupasta.', 'Mä ostan ruuat yleensä lähikaupasta.', 'I usually buy groceries at the nearby shop.', 'A2', (SELECT id FROM topics WHERE slug = 'shopping')),
  ('Tässä on se tuote mitä etsin.', 'Tässä on se tuote mitä mä etsin.', 'Here is the product I was looking for.', 'A2', (SELECT id FROM topics WHERE slug = 'shopping')),
  ('Voinko saada kassin mukaan?', 'Voinko mä saada kassin mukaan?', 'Can I get a bag with this?', 'A2', (SELECT id FROM topics WHERE slug = 'shopping')),
  ('Hinta on liian kallis minulle.', 'Hinta on liian kallis mulle.', 'The price is too expensive for me.', 'A2', (SELECT id FROM topics WHERE slug = 'shopping'))
ON CONFLICT DO NOTHING;

-- Topic: daily_routines
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Herään joka aamu seitsemältä.', 'Mä herään joka aamu seittemältä.', 'I wake up every morning at seven.', 'A1', (SELECT id FROM topics WHERE slug = 'daily_routines')),
  ('Pesen hampaani aamulla ja illalla.', 'Mä pesen hampaat aamulla ja illalla.', 'I brush my teeth in the morning and evening.', 'A1', (SELECT id FROM topics WHERE slug = 'daily_routines')),
  ('Juon aamukahvin ennen töihin lähtöä.', 'Mä juon aamukahvin ennen ku lähen töihin.', 'I drink my morning coffee before leaving for work.', 'A1', (SELECT id FROM topics WHERE slug = 'daily_routines')),
  ('Lähden töihin kahdeksalta.', 'Mä lähden töihin kahdeksalta.', 'I leave for work at eight.', 'A1', (SELECT id FROM topics WHERE slug = 'daily_routines')),
  ('Lounastauko on klo 12.', 'Lounastauko on kahdentoista aikaan.', 'Lunch break is at noon.', 'A1', (SELECT id FROM topics WHERE slug = 'daily_routines')),
  ('Tulen kotiin viiden jälkeen.', 'Mä tuun kotiin viiden jälkeen.', 'I come home after five.', 'A1', (SELECT id FROM topics WHERE slug = 'daily_routines')),
  ('Laitan ruokaa illalla.', 'Mä laitan ruokaa illalla.', 'I cook food in the evening.', 'A1', (SELECT id FROM topics WHERE slug = 'daily_routines')),
  ('Nukun kahdeksan tuntia yössä.', 'Mä nukun kahdeksan tuntia yössä.', 'I sleep eight hours a night.', 'A1', (SELECT id FROM topics WHERE slug = 'daily_routines')),
  ('Käyn kaupassa matkalla kotiin.', 'Mä käyn kaupas matkalla kotiin.', 'I stop at the shop on the way home.', 'A1', (SELECT id FROM topics WHERE slug = 'daily_routines')),
  ('Viikonloppuisin heräilen myöhemmin.', 'Viikonloppusin mä heräilen myöhemmin.', 'On weekends I sleep in later.', 'A1', (SELECT id FROM topics WHERE slug = 'daily_routines')),
  ('Arkisin käyn kielikurssilla töiden jälkeen.', 'Arkisin mä käyn kielikurssilla töiden jälkeen.', 'On weekdays I attend a language course after work.', 'A2', (SELECT id FROM topics WHERE slug = 'daily_routines')),
  ('Vien lapset päiväkotiin ennen töihin menoa.', 'Mä vien lapset päiväkotiin ennen ku meen töihin.', 'I drop the children at daycare before going to work.', 'A2', (SELECT id FROM topics WHERE slug = 'daily_routines')),
  ('Siivoan asunnon yleensä lauantaina.', 'Mä siivoon asunnon yleensä lauantaina.', 'I usually clean the apartment on Saturdays.', 'A2', (SELECT id FROM topics WHERE slug = 'daily_routines')),
  ('Harrastan liikuntaa kolme kertaa viikossa.', 'Mä harraan liikuntaa kolme kertaa viikossa.', 'I exercise three times a week.', 'A2', (SELECT id FROM topics WHERE slug = 'daily_routines')),
  ('Teen ruokaostokset netissä, jotta säästän aikaa.', 'Mä teen ruokaostokset netissä, et mä säästän aikaa.', 'I do my grocery shopping online to save time.', 'A2', (SELECT id FROM topics WHERE slug = 'daily_routines')),
  ('Kuuntelen podcasteja bussimatkalla.', 'Mä kuuntelen podcasteja bussimatkalla.', 'I listen to podcasts on the bus.', 'A2', (SELECT id FROM topics WHERE slug = 'daily_routines')),
  ('Ennen nukkumaanmenoa luen kirjaa.', 'Ennen ku mä meen nukkuu, mä luen kirjaa.', 'Before going to bed I read a book.', 'A2', (SELECT id FROM topics WHERE slug = 'daily_routines')),
  ('Muistutan itseäni kalenterisovelluksella.', 'Mä muistutan itteeni kalenterisovelluksella.', 'I remind myself with a calendar app.', 'A2', (SELECT id FROM topics WHERE slug = 'daily_routines')),
  ('Talvella on vaikea herätä pimeässä.', 'Talvella on vaikee herätä pimeässä.', 'In winter it is hard to wake up in the dark.', 'A2', (SELECT id FROM topics WHERE slug = 'daily_routines')),
  ('Käyn saunassa joka perjantai.', 'Mä käyn saunassa joka perjantai.', 'I go to the sauna every Friday.', 'A2', (SELECT id FROM topics WHERE slug = 'daily_routines'))
ON CONFLICT DO NOTHING;

-- Topic: health
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Minulla on päänsärky.', 'Mul on päänsärky.', 'I have a headache.', 'A1', (SELECT id FROM topics WHERE slug = 'health')),
  ('Tarvitsen lääkärinajan.', 'Mä tarviin lääkärinajan.', 'I need a doctor''s appointment.', 'A1', (SELECT id FROM topics WHERE slug = 'health')),
  ('Minulla on kuume.', 'Mul on kuume.', 'I have a fever.', 'A1', (SELECT id FROM topics WHERE slug = 'health')),
  ('Vatsaani sattuu.', 'Mua sattuu vatsa.', 'My stomach hurts.', 'A1', (SELECT id FROM topics WHERE slug = 'health')),
  ('Olen kipeä.', 'Mä oon kipeenä.', 'I am sick.', 'A1', (SELECT id FROM topics WHERE slug = 'health')),
  ('Apteekki on tuolla kadun varrella.', 'Apteekki on tuolla kadun varrella.', 'The pharmacy is along that street.', 'A1', (SELECT id FROM topics WHERE slug = 'health')),
  ('Tarvitsen reseptin lääkäriltä.', 'Mä tarviin reseptin lääkäriltä.', 'I need a prescription from the doctor.', 'A1', (SELECT id FROM topics WHERE slug = 'health')),
  ('Varaa aika terveyskeskukseen.', 'Varaa aika terveyskeskukseen.', 'Book an appointment at the health centre.', 'A1', (SELECT id FROM topics WHERE slug = 'health')),
  ('Minulla on allergia siitepölylle.', 'Mul on allergia siitepölylle.', 'I have an allergy to pollen.', 'A1', (SELECT id FROM topics WHERE slug = 'health')),
  ('Sairausvakuutuskortti on lompakossani.', 'Sairausvakuutuskortti on mun lompakossa.', 'The health insurance card is in my wallet.', 'A1', (SELECT id FROM topics WHERE slug = 'health')),
  ('Soitan terveyskeskukseen ajan varaamiseksi.', 'Mä soitan terveyskeskukseen et mä varaan ajan.', 'I call the health centre to book an appointment.', 'A2', (SELECT id FROM topics WHERE slug = 'health')),
  ('Lääkäri määräsi minulle antibioottikuurin.', 'Lääkäri määräs mulle antibioottikuurin.', 'The doctor prescribed me a course of antibiotics.', 'A2', (SELECT id FROM topics WHERE slug = 'health')),
  ('Minulla on krooninen selkäkipu.', 'Mul on krooninen selkäkipu.', 'I have chronic back pain.', 'A2', (SELECT id FROM topics WHERE slug = 'health')),
  ('Hakeuduin päivystykseen öiseen aikaan.', 'Mä menin päivystykseen yöllä.', 'I went to the emergency clinic at night.', 'A2', (SELECT id FROM topics WHERE slug = 'health')),
  ('Verikokeen tulokset tulevat viikon kuluessa.', 'Verikokeen tulokset tulee viikon sisällä.', 'The blood test results come within a week.', 'A2', (SELECT id FROM topics WHERE slug = 'health')),
  ('Terveyskeskuksessa on pitkä jono.', 'Terveyskeskuksessa on pitkä jono.', 'There is a long queue at the health centre.', 'A2', (SELECT id FROM topics WHERE slug = 'health')),
  ('Rokotukset ovat ilmaisia Suomessa.', 'Rokotukset on ilmaisia Suomessa.', 'Vaccinations are free in Finland.', 'A2', (SELECT id FROM topics WHERE slug = 'health')),
  ('Omaterveyspalvelulla voi varata ajan netissä.', 'Omaterveyspalvelulla voi varata ajan netissä.', 'You can book an appointment online with Omaolo.', 'A2', (SELECT id FROM topics WHERE slug = 'health')),
  ('Fysioterapia auttoi polven kuntoutuksessa.', 'Fysioterapia autto polven kuntoutuksessa.', 'Physiotherapy helped with the knee rehabilitation.', 'A2', (SELECT id FROM topics WHERE slug = 'health')),
  ('Muista ottaa lääke aterioiden yhteydessä.', 'Muista ottaa lääke ruuan kanssa.', 'Remember to take the medication with meals.', 'A2', (SELECT id FROM topics WHERE slug = 'health'))
ON CONFLICT DO NOTHING;

-- Topic: transport
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Milloin seuraava bussi lähtee?', 'Milloin seuraava bussi lähtee?', 'When does the next bus leave?', 'A1', (SELECT id FROM topics WHERE slug = 'transport')),
  ('Yksi lippu keskustaan, kiitos.', 'Yks lippu keskustaan, kiitos.', 'One ticket to the centre, please.', 'A1', (SELECT id FROM topics WHERE slug = 'transport')),
  ('Juna on myöhässä kymmenen minuuttia.', 'Juna on kymmenen minuuttia myöhässä.', 'The train is ten minutes late.', 'A1', (SELECT id FROM topics WHERE slug = 'transport')),
  ('Missä on lähin bussipysäkki?', 'Missä on lähin bussipysäkki?', 'Where is the nearest bus stop?', 'A1', (SELECT id FROM topics WHERE slug = 'transport')),
  ('Otan taksin kotiin.', 'Mä otan taksin kotiin.', 'I am taking a taxi home.', 'A1', (SELECT id FROM topics WHERE slug = 'transport')),
  ('Pyörällä pääsee nopeammin.', 'Pyörällä pääsee nopeemmin.', 'It is faster by bicycle.', 'A1', (SELECT id FROM topics WHERE slug = 'transport')),
  ('Matka kestää puoli tuntia.', 'Matka kestää puol tuntia.', 'The journey takes half an hour.', 'A1', (SELECT id FROM topics WHERE slug = 'transport')),
  ('Junalippu maksaa kaksitoista euroa.', 'Junalippu maksaa kakstoist euroa.', 'The train ticket costs twelve euros.', 'A1', (SELECT id FROM topics WHERE slug = 'transport')),
  ('Vaihdan metroon Hakaniemessä.', 'Mä vaihdan metroon Hakaniemessä.', 'I change to the metro at Hakaniemi.', 'A1', (SELECT id FROM topics WHERE slug = 'transport')),
  ('Parkkipaikka on täynnä.', 'Parkkipaikka on täynnä.', 'The car park is full.', 'A1', (SELECT id FROM topics WHERE slug = 'transport')),
  ('HSL-sovelluksella voi ostaa lippuja helposti.', 'HSL-sovelluksella voi ostaa lippuja helposti.', 'You can buy tickets easily with the HSL app.', 'A2', (SELECT id FROM topics WHERE slug = 'transport')),
  ('Talvella on hyvä käyttää talvirenkaita.', 'Talvella on hyvä käyttää talvirenkaita.', 'In winter it is good to use winter tyres.', 'A2', (SELECT id FROM topics WHERE slug = 'transport')),
  ('Lentokenttäbussi lähtee joka viidentoista minuutin välein.', 'Lentokenttäbussi lähtee joka viidentoista minuutin välein.', 'The airport bus departs every fifteen minutes.', 'A2', (SELECT id FROM topics WHERE slug = 'transport')),
  ('Tarvitsen kausilipun kuukaudeksi.', 'Mä tarviin kausilipun kuukaudeks.', 'I need a monthly season ticket.', 'A2', (SELECT id FROM topics WHERE slug = 'transport')),
  ('Rautatieasema on kävelyn päässä.', 'Rautatieasema on kävelymatkan päässä.', 'The railway station is within walking distance.', 'A2', (SELECT id FROM topics WHERE slug = 'transport')),
  ('Jäin viimeisestä bussista.', 'Mä jäin viimesestä bussista.', 'I missed the last bus.', 'A2', (SELECT id FROM topics WHERE slug = 'transport')),
  ('Voin lainata kaupunkipyörän sovelluksella.', 'Mä voin lainata kaupunkipyörän sovelluksella.', 'I can borrow a city bike using the app.', 'A2', (SELECT id FROM topics WHERE slug = 'transport')),
  ('Ajokorttiasi tarvitaan auton vuokraamiseen.', 'Sun ajokorttia tarvitaan auton vuokraamiseen.', 'Your driving licence is needed to rent a car.', 'A2', (SELECT id FROM topics WHERE slug = 'transport')),
  ('Reitti löytyy Google Mapsista.', 'Reitti löytyy Google Mapsista.', 'The route can be found on Google Maps.', 'A2', (SELECT id FROM topics WHERE slug = 'transport')),
  ('Polkupyöräkypärä on pakollinen lapsille.', 'Polkupyöräkypärä on pakollinen lapsille.', 'A bicycle helmet is mandatory for children.', 'A2', (SELECT id FROM topics WHERE slug = 'transport'))
ON CONFLICT DO NOTHING;

-- Topic: weather
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Tänään on kylmä.', 'Tänään on kylmä.', 'Today it is cold.', 'A1', (SELECT id FROM topics WHERE slug = 'weather')),
  ('Ulkona sataa lunta.', 'Ulkona sataa lunta.', 'It is snowing outside.', 'A1', (SELECT id FROM topics WHERE slug = 'weather')),
  ('Aurinko paistaa.', 'Aurinko paistaa.', 'The sun is shining.', 'A1', (SELECT id FROM topics WHERE slug = 'weather')),
  ('Sää on huono tänään.', 'Sää on huono tänään.', 'The weather is bad today.', 'A1', (SELECT id FROM topics WHERE slug = 'weather')),
  ('Tuulee todella kovaa.', 'Tuulee tosi kovaa.', 'It is very windy.', 'A1', (SELECT id FROM topics WHERE slug = 'weather')),
  ('Pue lämpimästi, on pakkainen.', 'Pue lämpimästi, on pakkanen.', 'Dress warmly, it is freezing.', 'A1', (SELECT id FROM topics WHERE slug = 'weather')),
  ('Lämpötila on miinus viisi astetta.', 'Lämpötila on miinus viis astetta.', 'The temperature is minus five degrees.', 'A1', (SELECT id FROM topics WHERE slug = 'weather')),
  ('Ota sateenvarjo mukaan.', 'Ota sateenvarjo mukaan.', 'Take an umbrella with you.', 'A1', (SELECT id FROM topics WHERE slug = 'weather')),
  ('Kesällä on lämmin.', 'Kesällä on lämmin.', 'In summer it is warm.', 'A1', (SELECT id FROM topics WHERE slug = 'weather')),
  ('Tänä viikonloppuna sataa vettä.', 'Tänä viikonloppuna sataa vettä.', 'This weekend it will rain.', 'A1', (SELECT id FROM topics WHERE slug = 'weather')),
  ('Syksyllä sää muuttuu nopeasti.', 'Syksyllä sää muuttuu nopeesti.', 'In autumn the weather changes quickly.', 'A2', (SELECT id FROM topics WHERE slug = 'weather')),
  ('Talvi kestää Suomessa useita kuukausia.', 'Talvi kestää Suomessa useita kuukausia.', 'Winter lasts several months in Finland.', 'A2', (SELECT id FROM topics WHERE slug = 'weather')),
  ('Ennuste lupaa poutaa ensi viikolla.', 'Ennuste lupaa poutaa ensi viikolla.', 'The forecast promises dry weather next week.', 'A2', (SELECT id FROM topics WHERE slug = 'weather')),
  ('Kaamos tarkoittaa aikaa kun aurinko ei nouse.', 'Kaamos tarkoittaa aikaa ku aurinko ei nouse.', 'Kaamos means the time when the sun does not rise.', 'A2', (SELECT id FROM topics WHERE slug = 'weather')),
  ('Liukkaat tiet aiheuttavat onnettomuuksia talvella.', 'Liukkaat tiet aiheuttaa onnettomuuksia talvella.', 'Icy roads cause accidents in winter.', 'A2', (SELECT id FROM topics WHERE slug = 'weather')),
  ('Kesällä Suomessa on yötön yö.', 'Kesällä Suomessa on yötön yö.', 'In summer Finland has the midnight sun.', 'A2', (SELECT id FROM topics WHERE slug = 'weather')),
  ('Revontulet näkyvät pohjoisessa talvella.', 'Revontulet näkyy pohjoisessa talvella.', 'The northern lights are visible in the north in winter.', 'A2', (SELECT id FROM topics WHERE slug = 'weather')),
  ('Säätiedotus tulee joka ilta televisiossa.', 'Säätiedotus tulee joka ilta televisiossa.', 'The weather forecast comes on television every evening.', 'A2', (SELECT id FROM topics WHERE slug = 'weather')),
  ('Keväällä lumi sulaa ja tiet muuttuvat mudaksi.', 'Keväällä lumi sulaa ja tiet muuttuu mudaks.', 'In spring the snow melts and the roads turn muddy.', 'A2', (SELECT id FROM topics WHERE slug = 'weather')),
  ('Ukkosmyrsky yllätti meidät puistossa.', 'Ukkosmyrsky yllätti meidät puistossa.', 'The thunderstorm caught us in the park.', 'A2', (SELECT id FROM topics WHERE slug = 'weather'))
ON CONFLICT DO NOTHING;

-- Topic: hobbies
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Pidän lukemisesta.', 'Mä tykkään lukemisesta.', 'I like reading.', 'A1', (SELECT id FROM topics WHERE slug = 'hobbies')),
  ('Pelaan jalkapalloa viikonloppuisin.', 'Mä pelaan jalkapalloa viikonloppusin.', 'I play football at the weekends.', 'A1', (SELECT id FROM topics WHERE slug = 'hobbies')),
  ('Käyn uimassa kesällä.', 'Mä käyn uimassa kesällä.', 'I go swimming in summer.', 'A1', (SELECT id FROM topics WHERE slug = 'hobbies')),
  ('Harrastan maalaamista.', 'Mä harraan maalaamista.', 'I do painting as a hobby.', 'A1', (SELECT id FROM topics WHERE slug = 'hobbies')),
  ('Kuuntelen musiikkia joka päivä.', 'Mä kuuntelen musiikkia joka päivä.', 'I listen to music every day.', 'A1', (SELECT id FROM topics WHERE slug = 'hobbies')),
  ('Käyn elokuvissa ystävien kanssa.', 'Mä käyn elokuvissa kavereiden kanssa.', 'I go to the cinema with friends.', 'A1', (SELECT id FROM topics WHERE slug = 'hobbies')),
  ('Minulla on koira jonka kanssa ulkoilen.', 'Mul on koira jonka kanssa mä ulkoilen.', 'I have a dog I walk with.', 'A1', (SELECT id FROM topics WHERE slug = 'hobbies')),
  ('Pelaan lautapelejä perheen kanssa.', 'Me pelataan lautapelejä perheen kanssa.', 'I play board games with the family.', 'A1', (SELECT id FROM topics WHERE slug = 'hobbies')),
  ('Tykkään valokuvata luontoa.', 'Mä tykkään valokuvata luontoa.', 'I like photographing nature.', 'A1', (SELECT id FROM topics WHERE slug = 'hobbies')),
  ('Harrastan hiihtoa talvisin.', 'Mä harraan hiihtoa talvisin.', 'I do cross-country skiing in winter.', 'A1', (SELECT id FROM topics WHERE slug = 'hobbies')),
  ('Olen ilmoittautunut joogatunneille.', 'Mä oon ilmottautunut joogatunneille.', 'I have signed up for yoga classes.', 'A2', (SELECT id FROM topics WHERE slug = 'hobbies')),
  ('Luen suomalaisia romaaneja parantaakseni kieltä.', 'Mä luen suomalaisia romaaneja et mä parannan kieltä.', 'I read Finnish novels to improve my language.', 'A2', (SELECT id FROM topics WHERE slug = 'hobbies')),
  ('Käyn mielelläni museossa tai galleriassa.', 'Mä käyn mielelläni museossa tai galleriassa.', 'I enjoy going to museums or galleries.', 'A2', (SELECT id FROM topics WHERE slug = 'hobbies')),
  ('Kirpputori on loistava paikka löytää kirjoja.', 'Kirpputori on loistava paikka löytää kirjoja.', 'The flea market is a great place to find books.', 'A2', (SELECT id FROM topics WHERE slug = 'hobbies')),
  ('Olen liittynyt paikalliseen urheiluseuraan.', 'Mä oon liittyny paikalliseen urheiluseuraan.', 'I have joined the local sports club.', 'A2', (SELECT id FROM topics WHERE slug = 'hobbies')),
  ('Viihdyn käymässä konserteissa.', 'Mä viihdyn käymässä konserteissa.', 'I enjoy going to concerts.', 'A2', (SELECT id FROM topics WHERE slug = 'hobbies')),
  ('Harrastan neulomista talvella.', 'Mä harraan neulomista talvella.', 'I knit in winter as a hobby.', 'A2', (SELECT id FROM topics WHERE slug = 'hobbies')),
  ('Pelaan videopelejä illalla rentoutuakseni.', 'Mä pelaan videopelejä illalla et mä rentoudun.', 'I play video games in the evening to relax.', 'A2', (SELECT id FROM topics WHERE slug = 'hobbies')),
  ('Lenkkeilen puistossa joka aamu.', 'Mä lenkkeilen puistossa joka aamu.', 'I jog in the park every morning.', 'A2', (SELECT id FROM topics WHERE slug = 'hobbies')),
  ('Suomessa on paljon hyviä vaellusreittejä.', 'Suomessa on paljon hyviä vaellusreittejä.', 'Finland has many good hiking trails.', 'A2', (SELECT id FROM topics WHERE slug = 'hobbies'))
ON CONFLICT DO NOTHING;

-- Topic: events
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Juhlat alkavat kello kahdeksan.', 'Juhlat alkaa kello kahdeksan.', 'The party starts at eight o''clock.', 'A1', (SELECT id FROM topics WHERE slug = 'events')),
  ('Sinulla on kutsu häihin.', 'Sul on kutsu häihin.', 'You have an invitation to the wedding.', 'A1', (SELECT id FROM topics WHERE slug = 'events')),
  ('Konsertti on loppuunmyyty.', 'Konsertti on loppuunmyyty.', 'The concert is sold out.', 'A1', (SELECT id FROM topics WHERE slug = 'events')),
  ('Syntymäpäivä on ensi viikolla.', 'Synttärit on ensi viikolla.', 'The birthday is next week.', 'A1', (SELECT id FROM topics WHERE slug = 'events')),
  ('Onneksi olkoon!', 'Onneks olkoon!', 'Congratulations!', 'A1', (SELECT id FROM topics WHERE slug = 'events')),
  ('Mitä lahjaksi ostat?', 'Mitä lahjaa sä ostat?', 'What gift are you buying?', 'A1', (SELECT id FROM topics WHERE slug = 'events')),
  ('Joulu on joulukuun 25. päivä.', 'Joulu on joulukuun kahdennykyidensviides päivä.', 'Christmas is on the 25th of December.', 'A1', (SELECT id FROM topics WHERE slug = 'events')),
  ('Juhannus vietetään kesäkuussa.', 'Juhannus vietetään kesäkuussa.', 'Midsummer is celebrated in June.', 'A1', (SELECT id FROM topics WHERE slug = 'events')),
  ('Ilotulitus alkaa puolenyön jälkeen.', 'Ilotulitus alkaa puolenyön jälkeen.', 'The fireworks start after midnight.', 'A1', (SELECT id FROM topics WHERE slug = 'events')),
  ('Tapahtuma järjestetään torilla.', 'Tapahtuma järjestetään torilla.', 'The event is held in the market square.', 'A1', (SELECT id FROM topics WHERE slug = 'events')),
  ('Varasin liput etukäteen verkosta.', 'Mä varasin liput etukäteen netistä.', 'I booked the tickets in advance online.', 'A2', (SELECT id FROM topics WHERE slug = 'events')),
  ('Olen kutsuttu kollegani valmistumisjuhliin.', 'Mä oon kutsuttu mun kollegan valmistumisjuhliin.', 'I have been invited to my colleague''s graduation party.', 'A2', (SELECT id FROM topics WHERE slug = 'events')),
  ('Kaupungissa on tänä viikonloppuna festivaali.', 'Kaupungissa on tänä viikonloppuna festivaali.', 'There is a festival in the city this weekend.', 'A2', (SELECT id FROM topics WHERE slug = 'events')),
  ('Pöytävaraus tehdään ravintolaan etukäteen.', 'Pöytävaraus tehdään ravintolaan etukäteen.', 'A table reservation is made at the restaurant in advance.', 'A2', (SELECT id FROM topics WHERE slug = 'events')),
  ('Vappu on suosittu katujuhla Suomessa.', 'Vappu on suosittu katujuhla Suomessa.', 'May Day is a popular street celebration in Finland.', 'A2', (SELECT id FROM topics WHERE slug = 'events')),
  ('Uuden vuoden ohjelma alkaa television puolelta yöllä.', 'Uuden vuoden ohjelma alkaa televisiossa puolelta yöllä.', 'The New Year programme starts on TV at midnight.', 'A2', (SELECT id FROM topics WHERE slug = 'events')),
  ('Tori on täynnä ihmisiä markkinapäivänä.', 'Tori on täynnä ihmisiä markkinapäivänä.', 'The square is full of people on market day.', 'A2', (SELECT id FROM topics WHERE slug = 'events')),
  ('Otin yhteyttä järjestäjään kysyäkseni yksityiskohtia.', 'Mä otin yhteyttä järjestäjään et mä kysyin yksityiskohtia.', 'I contacted the organiser to ask for details.', 'A2', (SELECT id FROM topics WHERE slug = 'events')),
  ('Itsenäisyyspäivä on kuudentena joulukuuta.', 'Itsenäisyyspäivä on kuudentena joulukuuta.', 'Independence Day is on the sixth of December.', 'A2', (SELECT id FROM topics WHERE slug = 'events')),
  ('Lippu sisältää myös narikoiden käytön.', 'Lippu sisältää myös narikoiden käytön.', 'The ticket also includes use of the cloakroom.', 'A2', (SELECT id FROM topics WHERE slug = 'events'))
ON CONFLICT DO NOTHING;

-- Topic: work_general
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Työskentelen toimistossa.', 'Mä työskentelen toimistossa.', 'I work in an office.', 'A1', (SELECT id FROM topics WHERE slug = 'work_general')),
  ('Aloitan työn kahdeksalta.', 'Mä aloitan työn kahdeksalta.', 'I start work at eight.', 'A1', (SELECT id FROM topics WHERE slug = 'work_general')),
  ('Minulla on kokous aamulla.', 'Mul on kokous aamulla.', 'I have a meeting in the morning.', 'A1', (SELECT id FROM topics WHERE slug = 'work_general')),
  ('Lähetin sähköpostin pomolleni.', 'Mä lähetin sähköpostin mun pomolle.', 'I sent an email to my boss.', 'A1', (SELECT id FROM topics WHERE slug = 'work_general')),
  ('Taukohuone on toisessa kerroksessa.', 'Taukohuone on toisessa kerroksessa.', 'The break room is on the second floor.', 'A1', (SELECT id FROM topics WHERE slug = 'work_general')),
  ('Palkkani maksetaan kuun viimeisenä.', 'Mun palkka maksetaan kuun viimeisenä.', 'My salary is paid on the last day of the month.', 'A1', (SELECT id FROM topics WHERE slug = 'work_general')),
  ('Työvuoro kestää kahdeksan tuntia.', 'Työvuoro kestää kahdeksan tuntia.', 'The work shift lasts eight hours.', 'A1', (SELECT id FROM topics WHERE slug = 'work_general')),
  ('Minulla on vapaa viikonloppuisin.', 'Mul on vapaa viikonloppusin.', 'I have time off at weekends.', 'A1', (SELECT id FROM topics WHERE slug = 'work_general')),
  ('Toimiston puhelin numero on tuossa seinällä.', 'Toimiston puhelinnumero on tuossa seinällä.', 'The office phone number is on the wall there.', 'A1', (SELECT id FROM topics WHERE slug = 'work_general')),
  ('Etätyö on mahdollista tiistaisin.', 'Etätyö on mahdollista tiistaisin.', 'Remote work is possible on Tuesdays.', 'A1', (SELECT id FROM topics WHERE slug = 'work_general')),
  ('Tarvitsen tulkin työnantajan kanssa käytävään kokoukseen.', 'Mä tarviin tulkin työnantajan kanssa käytävään kokoukseen.', 'I need an interpreter for the meeting with the employer.', 'A2', (SELECT id FROM topics WHERE slug = 'work_general')),
  ('Työsopimus on määräaikainen kuudeksi kuukaudeksi.', 'Työsopimus on määräaikainen kuudeks kuukaudeks.', 'The employment contract is fixed-term for six months.', 'A2', (SELECT id FROM topics WHERE slug = 'work_general')),
  ('Ylityöt korvataan vapaapäivinä.', 'Ylityöt korvataan vapaapäivinä.', 'Overtime is compensated with days off.', 'A2', (SELECT id FROM topics WHERE slug = 'work_general')),
  ('Minulla on oikeus vuosilomaan lain mukaan.', 'Mul on oikeus vuosilomaan lain mukaan.', 'I am entitled to annual leave by law.', 'A2', (SELECT id FROM topics WHERE slug = 'work_general')),
  ('Perehdytys kestää yhden viikon.', 'Perehdytys kestää yhden viikon.', 'The orientation lasts one week.', 'A2', (SELECT id FROM topics WHERE slug = 'work_general')),
  ('Työvuorolista julkaistaan joka maanantai.', 'Työvuorolista julkaistaan joka maanantai.', 'The shift schedule is published every Monday.', 'A2', (SELECT id FROM topics WHERE slug = 'work_general')),
  ('Ilmoitin sairauspoissaolosta esimiehelle aamulla.', 'Mä ilmottu sairauspoissaolosta esimiehelle aamulla.', 'I reported sick leave to my supervisor in the morning.', 'A2', (SELECT id FROM topics WHERE slug = 'work_general')),
  ('Tulospalkkio maksetaan vuoden lopussa.', 'Tulospalkkio maksetaan vuoden lopussa.', 'The performance bonus is paid at the end of the year.', 'A2', (SELECT id FROM topics WHERE slug = 'work_general')),
  ('Liityin ammattiliittoon töihin aloitettuani.', 'Mä liityin ammattiliittoon ku mä aloitin töissä.', 'I joined the trade union when I started work.', 'A2', (SELECT id FROM topics WHERE slug = 'work_general')),
  ('Työterveys hoitaa sairauslomat ja tarkastukset.', 'Työterveys hoitaa sairauslomat ja tarkastukset.', 'Occupational health handles sick leave and check-ups.', 'A2', (SELECT id FROM topics WHERE slug = 'work_general'))
ON CONFLICT DO NOTHING;

-- Topic: workplace
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Minulla on oma työpiste toimistossa.', 'Mul on oma työpiste toimistossa.', 'I have my own workstation in the office.', 'A1', (SELECT id FROM topics WHERE slug = 'workplace')),
  ('Kokoukset pidetään neuvotteluhuoneessa.', 'Kokoukset pidetään neuvotteluhuoneessa.', 'Meetings are held in the conference room.', 'A1', (SELECT id FROM topics WHERE slug = 'workplace')),
  ('Tulostin on käytävällä.', 'Tulostin on käytävällä.', 'The printer is in the corridor.', 'A1', (SELECT id FROM topics WHERE slug = 'workplace')),
  ('Kahvihuone on toisessa kerroksessa.', 'Kahvihuone on toisessa kerroksessa.', 'The coffee room is on the second floor.', 'A1', (SELECT id FROM topics WHERE slug = 'workplace')),
  ('Kirjaudu sisään kulkukortilla.', 'Kirjaudu sisään kulkukortilla.', 'Log in with your access card.', 'A1', (SELECT id FROM topics WHERE slug = 'workplace')),
  ('Esimies antaa palautetta viikoittain.', 'Esimies antaa palautetta viikoittain.', 'The supervisor gives feedback weekly.', 'A1', (SELECT id FROM topics WHERE slug = 'workplace')),
  ('Toimisto on auki arkipäivisin.', 'Toimisto on auki arkipäivisin.', 'The office is open on weekdays.', 'A1', (SELECT id FROM topics WHERE slug = 'workplace')),
  ('Puhelinäänekkyys on pidettävä hiljaisena toimistossa.', 'Puhelin pitää pitää äänettömällä toimistossa.', 'The phone should be kept on silent in the office.', 'A1', (SELECT id FROM topics WHERE slug = 'workplace')),
  ('Toimistossa on hyvä ilmapiiri.', 'Toimistossa on hyvä ilmapiiri.', 'The atmosphere in the office is good.', 'A1', (SELECT id FROM topics WHERE slug = 'workplace')),
  ('Lähetin raportin sähköpostilla.', 'Mä lähetin raportin sähköpostilla.', 'I sent the report by email.', 'A1', (SELECT id FROM topics WHERE slug = 'workplace')),
  ('Kehityskeskustelu käydään kaksi kertaa vuodessa.', 'Kehityskeskustelu käydään kaksi kertaa vuodessa.', 'The performance review is held twice a year.', 'A2', (SELECT id FROM topics WHERE slug = 'workplace')),
  ('Kirjallinen työsopimus allekirjoitetaan ennen aloittamista.', 'Kirjallinen työsopimus allekirjoitetaan ennen aloittamista.', 'The written employment contract is signed before starting.', 'A2', (SELECT id FROM topics WHERE slug = 'workplace')),
  ('Tarvitsen pääsyn yrityksen järjestelmiin.', 'Mä tarviin pääsyn yrityksen järjestelmiin.', 'I need access to the company systems.', 'A2', (SELECT id FROM topics WHERE slug = 'workplace')),
  ('Työtoveri neuvoi minua uuden ohjelman käytössä.', 'Työtoveri neuvo mua uuden ohjelman käytössä.', 'A colleague helped me with using the new software.', 'A2', (SELECT id FROM topics WHERE slug = 'workplace')),
  ('Osallistun pakolliseen turvallisuuskoulutukseen.', 'Mä osallistun pakolliseen turvallisuuskoulutukseen.', 'I am attending the mandatory safety training.', 'A2', (SELECT id FROM topics WHERE slug = 'workplace')),
  ('Etäpalaveri järjestetään Teamsin kautta.', 'Etäpalaveri järjestetään Teamsin kautta.', 'The remote meeting is held via Teams.', 'A2', (SELECT id FROM topics WHERE slug = 'workplace')),
  ('Ylitöistä sovitaan aina etukäteen esimiehen kanssa.', 'Ylitöistä sovitaan aina etukäteen esimiehen kanssa.', 'Overtime is always agreed in advance with the supervisor.', 'A2', (SELECT id FROM topics WHERE slug = 'workplace')),
  ('Avoin konttorikulttuuri edistää yhteistyötä.', 'Avoin konttoriympäristö edistää yhteistyötä.', 'An open-plan office promotes collaboration.', 'A2', (SELECT id FROM topics WHERE slug = 'workplace')),
  ('Sain kollegaltani hyvää apua projektin kanssa.', 'Mä sain kollegalta hyvää apua projektin kanssa.', 'I got good help from a colleague on the project.', 'A2', (SELECT id FROM topics WHERE slug = 'workplace')),
  ('Lounasetu on osa työsuhde-etuja.', 'Lounasetu on osa työsuhde-etuja.', 'The lunch benefit is part of the employee benefits.', 'A2', (SELECT id FROM topics WHERE slug = 'workplace'))
ON CONFLICT DO NOTHING;

-- Topic: job_search
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Etsin työtä Helsingistä.', 'Mä etsin työtä Helsingistä.', 'I am looking for work in Helsinki.', 'A1', (SELECT id FROM topics WHERE slug = 'job_search')),
  ('Lähetin hakemuksen eilen.', 'Mä lähetin hakemuksen eilen.', 'I sent the application yesterday.', 'A1', (SELECT id FROM topics WHERE slug = 'job_search')),
  ('Haastattelu on ensi tiistaina.', 'Haastattelu on ensi tiistaina.', 'The interview is next Tuesday.', 'A1', (SELECT id FROM topics WHERE slug = 'job_search')),
  ('Ansioluettelo pitää olla suomeksi.', 'Ansioluettelo pitää olla suomeksi.', 'The CV needs to be in Finnish.', 'A1', (SELECT id FROM topics WHERE slug = 'job_search')),
  ('Olen rekisteröitynyt TE-palveluihin.', 'Mä oon rekisteröityny TE-palveluihin.', 'I have registered with the Employment Services.', 'A1', (SELECT id FROM topics WHERE slug = 'job_search')),
  ('Tarvitsen suosituskirjeen entiseltä työnantajalta.', 'Mä tarviin suosituskirjeen entiseltä työnantajalta.', 'I need a reference letter from a previous employer.', 'A1', (SELECT id FROM topics WHERE slug = 'job_search')),
  ('Ilmoitus on mol.fi-sivustolla.', 'Ilmoitus on mol.fi-sivustolla.', 'The job ad is on the mol.fi website.', 'A1', (SELECT id FROM topics WHERE slug = 'job_search')),
  ('Minulla on viisi vuotta työkokemusta.', 'Mul on viis vuotta työkokemusta.', 'I have five years of work experience.', 'A1', (SELECT id FROM topics WHERE slug = 'job_search')),
  ('Koulutukseni vastaa tehtävän vaatimuksia.', 'Mun koulutus vastaa tehtävän vaatimuksia.', 'My education matches the job requirements.', 'A1', (SELECT id FROM topics WHERE slug = 'job_search')),
  ('Palkkaneuvottelu on tärkeä osa työnhakua.', 'Palkaneuvottelu on tärkeä osa työnhakua.', 'Salary negotiation is an important part of job seeking.', 'A1', (SELECT id FROM topics WHERE slug = 'job_search')),
  ('Osallistuin työvoimakoulutukseen parantaakseni mahdollisuuksiani.', 'Mä osallistuin työvoimakoulutukseen et mä parantaisin mun mahdollisuuksia.', 'I attended employment training to improve my chances.', 'A2', (SELECT id FROM topics WHERE slug = 'job_search')),
  ('Haen töihin omalla osaamisalueellani.', 'Mä haen töihin omalla osaamisalueellani.', 'I am applying for jobs in my own field of expertise.', 'A2', (SELECT id FROM topics WHERE slug = 'job_search')),
  ('LinkedIn-profiili auttaa löytämään kontakteja.', 'LinkedIn-profiili auttaa löytää kontakteja.', 'A LinkedIn profile helps find contacts.', 'A2', (SELECT id FROM topics WHERE slug = 'job_search')),
  ('Työnantaja vaatii B1-tasoista suomen kielen taitoa.', 'Työnantaja vaatii B1-tasoista suomen kielen taitoa.', 'The employer requires B1-level Finnish language skills.', 'A2', (SELECT id FROM topics WHERE slug = 'job_search')),
  ('Olen hakenut kymmeneen eri paikkaan tänä kuuna.', 'Mä oon hakenu kymmeneen eri paikkaan tänä kuuna.', 'I have applied to ten different places this month.', 'A2', (SELECT id FROM topics WHERE slug = 'job_search')),
  ('Sain kutsun haastatteluun kahden viikon kuluttua.', 'Mä sain kutsun haastatteluun kahden viikon kuluttua.', 'I received an interview invitation after two weeks.', 'A2', (SELECT id FROM topics WHERE slug = 'job_search')),
  ('Koeaika on yleensä kolmesta kuuteen kuukautta.', 'Koeaika on yleensä kolmesta kuuteen kuukautta.', 'The probation period is usually three to six months.', 'A2', (SELECT id FROM topics WHERE slug = 'job_search')),
  ('Palkkatoiveeni on neljätuhatta euroa kuussa.', 'Mun palkkatoive on neljätuhatta euroa kuussa.', 'My salary expectation is four thousand euros per month.', 'A2', (SELECT id FROM topics WHERE slug = 'job_search')),
  ('Yrityksen kulttuuri vaikuttaa työssä viihtymiseen.', 'Yrityksen kulttuuri vaikuttaa työssä viihtymiseen.', 'Company culture affects job satisfaction.', 'A2', (SELECT id FROM topics WHERE slug = 'job_search')),
  ('Rekrytointiprosessi kesti kolme kuukautta.', 'Rekrytointiprosessi kesti kolme kuukautta.', 'The recruitment process took three months.', 'A2', (SELECT id FROM topics WHERE slug = 'job_search'))
ON CONFLICT DO NOTHING;

-- Topic: education
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Lapsi aloittaa koulun seitsemänvuotiaana.', 'Lapsi aloittaa koulun seittemänvuotiaana.', 'Children start school at age seven.', 'A1', (SELECT id FROM topics WHERE slug = 'education')),
  ('Koulu alkaa kahdeksalta aamulla.', 'Koulu alkaa kahdeksalta aamulla.', 'School starts at eight in the morning.', 'A1', (SELECT id FROM topics WHERE slug = 'education')),
  ('Opettaja selittää tehtävän.', 'Opettaja selittää tehtävän.', 'The teacher explains the task.', 'A1', (SELECT id FROM topics WHERE slug = 'education')),
  ('Läksyt tehdään kotona.', 'Läksyt tehdään kotona.', 'Homework is done at home.', 'A1', (SELECT id FROM topics WHERE slug = 'education')),
  ('Kirjasto on koulun vieressä.', 'Kirjasto on koulun vieressä.', 'The library is next to the school.', 'A1', (SELECT id FROM topics WHERE slug = 'education')),
  ('Opiskelen suomea aikuiskoulutuskeskuksessa.', 'Mä opiskelen suomee aikuiskoulutuskeskuksessa.', 'I study Finnish at an adult education centre.', 'A1', (SELECT id FROM topics WHERE slug = 'education')),
  ('Kurssi alkaa ensi maanantaina.', 'Kurssi alkaa ensi maanantaina.', 'The course starts next Monday.', 'A1', (SELECT id FROM topics WHERE slug = 'education')),
  ('Opetuskieli on suomi.', 'Opetuskieli on suomi.', 'The language of instruction is Finnish.', 'A1', (SELECT id FROM topics WHERE slug = 'education')),
  ('Tentti on perjantaina.', 'Tentti on perjantaina.', 'The exam is on Friday.', 'A1', (SELECT id FROM topics WHERE slug = 'education')),
  ('Päiväkodissa lapset oppivat suomea leikkimällä.', 'Päiväkodissa lapset oppii suomee leikkimällä.', 'In daycare children learn Finnish through play.', 'A1', (SELECT id FROM topics WHERE slug = 'education')),
  ('Kotoutumiskoulutus sisältää suomen kielen opetusta.', 'Kotoutumiskoulutus sisältää suomen kielen opetusta.', 'Integration training includes Finnish language instruction.', 'A2', (SELECT id FROM topics WHERE slug = 'education')),
  ('Ylioppilastutkinto suoritetaan lukion lopussa.', 'Ylioppilastutkinto suoritetaan lukion lopussa.', 'The matriculation examination is taken at the end of upper secondary school.', 'A2', (SELECT id FROM topics WHERE slug = 'education')),
  ('Ammattikoulussa opitaan käytännön taitoja.', 'Ammattikoulussa opitaan käytännön taitoja.', 'In vocational school practical skills are taught.', 'A2', (SELECT id FROM topics WHERE slug = 'education')),
  ('Ilmoittautuminen kurssille tapahtuu netissä.', 'Ilmottautuminen kurssille tapahtuu netissä.', 'Registration for the course is done online.', 'A2', (SELECT id FROM topics WHERE slug = 'education')),
  ('Koulutodistus täytyy kääntää suomeksi.', 'Koulutodistus täytyy kääntää suomeksi.', 'The school certificate needs to be translated into Finnish.', 'A2', (SELECT id FROM topics WHERE slug = 'education')),
  ('Opiskelija voi hakea opintotukea Kelasta.', 'Opiskelija voi hakea opintotukea Kelasta.', 'A student can apply for student benefit from Kela.', 'A2', (SELECT id FROM topics WHERE slug = 'education')),
  ('Ammattikorkeakouluun haetaan yhteishaun kautta.', 'Ammattikorkeakouluun haetaan yhteishaun kautta.', 'Applications to universities of applied sciences go through a joint application process.', 'A2', (SELECT id FROM topics WHERE slug = 'education')),
  ('Opettaja antoi minulle lisätehtäviä.', 'Opettaja anto mulle lisätehtäviä.', 'The teacher gave me extra assignments.', 'A2', (SELECT id FROM topics WHERE slug = 'education')),
  ('Luokassa on kaksikymmentä opiskelijaa.', 'Luokassa on kakskymmentä opiskelijaa.', 'There are twenty students in the class.', 'A2', (SELECT id FROM topics WHERE slug = 'education')),
  ('Opettaja puhuu selkeästi ja hitaasti meille.', 'Opettaja puhuu selkeesti ja hitaasti meille.', 'The teacher speaks clearly and slowly for us.', 'A2', (SELECT id FROM topics WHERE slug = 'education'))
ON CONFLICT DO NOTHING;

-- Topic: technology
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Puhelin on latautunut.', 'Puhelin on ladattu.', 'The phone is charged.', 'A1', (SELECT id FROM topics WHERE slug = 'technology')),
  ('Salasana on unohtunut.', 'Salasana on unohtunut.', 'The password has been forgotten.', 'A1', (SELECT id FROM topics WHERE slug = 'technology')),
  ('Nettiyhteys ei toimi.', 'Netti ei toimi.', 'The internet connection is not working.', 'A1', (SELECT id FROM topics WHERE slug = 'technology')),
  ('Sovellus on ilmainen puhelimeen.', 'Sovellus on ilmainen puhelimeen.', 'The app is free for the phone.', 'A1', (SELECT id FROM topics WHERE slug = 'technology')),
  ('Lataa ohjelma netistä.', 'Lataa ohjelma netistä.', 'Download the program from the internet.', 'A1', (SELECT id FROM topics WHERE slug = 'technology')),
  ('Lähetän viestin WhatsAppissa.', 'Mä lähetän viestin WhatsAppissa.', 'I send a message on WhatsApp.', 'A1', (SELECT id FROM topics WHERE slug = 'technology')),
  ('Tietokone täytyy käynnistää uudelleen.', 'Tietokone täytyy käynnistää uudelleen.', 'The computer needs to be restarted.', 'A1', (SELECT id FROM topics WHERE slug = 'technology')),
  ('Valokuva on tallennettu puhelimeen.', 'Valokuva on tallennettu puhelimeen.', 'The photo has been saved to the phone.', 'A1', (SELECT id FROM topics WHERE slug = 'technology')),
  ('Wifi-salasana on reitittimen pohjassa.', 'Wifi-salasana on reitittimen pohjassa.', 'The wifi password is on the bottom of the router.', 'A1', (SELECT id FROM topics WHERE slug = 'technology')),
  ('Käytän pankkiasioihin verkkopankkia.', 'Mä käytän pankkiasioihin verkkopankkia.', 'I use online banking for banking matters.', 'A1', (SELECT id FROM topics WHERE slug = 'technology')),
  ('Suomi.fi-palvelussa voi hoitaa viranomaisasioita.', 'Suomi.fi-palvelussa voi hoitaa viranomaisasioita.', 'Official matters can be handled on the Suomi.fi service.', 'A2', (SELECT id FROM topics WHERE slug = 'technology')),
  ('Sähköinen tunnistautuminen vaatii pankkitunnukset.', 'Sähköinen tunnistautuminen vaatii pankkitunnukset.', 'Electronic identification requires online banking credentials.', 'A2', (SELECT id FROM topics WHERE slug = 'technology')),
  ('Tietoturva on tärkeää netissä asioitaessa.', 'Tietoturva on tärkeää netissä asioitaessa.', 'Data security is important when transacting online.', 'A2', (SELECT id FROM topics WHERE slug = 'technology')),
  ('Ohjelmistopäivitys asennetaan automaattisesti.', 'Ohjelmistopäivitys asentuu automaattisesti.', 'The software update installs automatically.', 'A2', (SELECT id FROM topics WHERE slug = 'technology')),
  ('Pilvipalveluun tallennetaan tärkeät tiedostot.', 'Pilvipalveluun tallennetaan tärkeät tiedostot.', 'Important files are stored in the cloud service.', 'A2', (SELECT id FROM topics WHERE slug = 'technology')),
  ('Videosoitto onnistuu ilmaisella sovelluksella.', 'Videosoitto onnistuu ilmasella sovelluksella.', 'A video call works with a free app.', 'A2', (SELECT id FROM topics WHERE slug = 'technology')),
  ('Phishing-viestit ovat yleistyneet paljon.', 'Phishing-viestit on yleistyny paljon.', 'Phishing messages have become much more common.', 'A2', (SELECT id FROM topics WHERE slug = 'technology')),
  ('Kännykkä täytyy rekisteröidä operaattorin verkkoon.', 'Kännykkä täytyy rekisteröidä operaattorin verkkoon.', 'The mobile phone must be registered to the operator''s network.', 'A2', (SELECT id FROM topics WHERE slug = 'technology')),
  ('Tekoäly auttaa kääntämään tekstejä.', 'Tekoäly auttaa kääntämään tekstejä.', 'Artificial intelligence helps with translating texts.', 'A2', (SELECT id FROM topics WHERE slug = 'technology')),
  ('Sosiaalinen media vie paljon aikaa.', 'Some vie paljon aikaa.', 'Social media takes up a lot of time.', 'A2', (SELECT id FROM topics WHERE slug = 'technology'))
ON CONFLICT DO NOTHING;

-- Topic: banking
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Haluaisin avata pankkitilin.', 'Mä haluisin avata pankkitilin.', 'I would like to open a bank account.', 'A1', (SELECT id FROM topics WHERE slug = 'banking')),
  ('Mikä on tämän pankin aukioloaika?', 'Mitkä on tän pankin aukioloajat?', 'What are the opening hours of this bank?', 'A1', (SELECT id FROM topics WHERE slug = 'banking')),
  ('Tarvitsen pankkikortin.', 'Mä tarviin pankkikortin.', 'I need a bank card.', 'A1', (SELECT id FROM topics WHERE slug = 'banking')),
  ('PIN-koodi on salainen.', 'PIN-koodi on salainen.', 'The PIN code is secret.', 'A1', (SELECT id FROM topics WHERE slug = 'banking')),
  ('Siirsin rahaa tililtä toiselle.', 'Mä siirsin rahaa tililtä toiselle.', 'I transferred money from one account to another.', 'A1', (SELECT id FROM topics WHERE slug = 'banking')),
  ('Maksan laskun verkkopankissa.', 'Mä maksan laskun verkkopankissa.', 'I pay the bill in online banking.', 'A1', (SELECT id FROM topics WHERE slug = 'banking')),
  ('Tiliotteessa näkyy kaikki tapahtumat.', 'Tiliotteessa näkyy kaikki tapahtumat.', 'All transactions are visible in the bank statement.', 'A1', (SELECT id FROM topics WHERE slug = 'banking')),
  ('Kortilla maksettaessa tunnusluku on pakollinen.', 'Kortilla maksaessa tunnusluku on pakollinen.', 'When paying by card a PIN is mandatory.', 'A1', (SELECT id FROM topics WHERE slug = 'banking')),
  ('Pankkitunnukset ovat henkilökohtaiset.', 'Pankkitunnukset on henkilökohtaiset.', 'Online banking credentials are personal.', 'A1', (SELECT id FROM topics WHERE slug = 'banking')),
  ('Valuutanvaihto onnistuu pankissa.', 'Valuutanvaihto onnistuu pankissa.', 'Currency exchange is possible at the bank.', 'A1', (SELECT id FROM topics WHERE slug = 'banking')),
  ('Pankkitilin avaaminen vaatii henkilöllisyystodistuksen.', 'Pankkitilin avaaminen vaatii henkilöllisyystodistuksen.', 'Opening a bank account requires an identity document.', 'A2', (SELECT id FROM topics WHERE slug = 'banking')),
  ('Luottokortin korko on korkea.', 'Luottokortin korko on korkea.', 'The interest on a credit card is high.', 'A2', (SELECT id FROM topics WHERE slug = 'banking')),
  ('Voin asioida pankissa myös sovelluksella.', 'Mä voin asioida pankissa myös sovelluksella.', 'I can do banking using the app too.', 'A2', (SELECT id FROM topics WHERE slug = 'banking')),
  ('Käteistä voi nostaa automaatista.', 'Käteistä voi nostaa automaatista.', 'Cash can be withdrawn from the ATM.', 'A2', (SELECT id FROM topics WHERE slug = 'banking')),
  ('Epäilyttävistä tapahtumista pitää ilmoittaa pankille.', 'Epäilyttävistä tapahtumista pitää ilmottaa pankille.', 'Suspicious transactions should be reported to the bank.', 'A2', (SELECT id FROM topics WHERE slug = 'banking')),
  ('Tilin saldon voi tarkistaa sovelluksesta.', 'Tilin saldon voi tarkistaa sovelluksesta.', 'The account balance can be checked in the app.', 'A2', (SELECT id FROM topics WHERE slug = 'banking')),
  ('Pikavippi on kallis tapa lainata rahaa.', 'Pikavippi on kallis tapa lainata rahaa.', 'A payday loan is an expensive way to borrow money.', 'A2', (SELECT id FROM topics WHERE slug = 'banking')),
  ('Asuntolainaa haetaan pankista kirjallisesti.', 'Asuntolainaa haetaan pankista kirjallisesti.', 'A mortgage is applied for from the bank in writing.', 'A2', (SELECT id FROM topics WHERE slug = 'banking')),
  ('Tiliehtoihin kannattaa tutustua huolella.', 'Tiliehtoihin kannattaa tutustuu huolella.', 'It is worth reading the account terms carefully.', 'A2', (SELECT id FROM topics WHERE slug = 'banking')),
  ('Suomessa yleisimmin käytetty maksuväline on kortti.', 'Suomessa yleisin maksuväline on kortti.', 'In Finland the most common payment method is card.', 'A2', (SELECT id FROM topics WHERE slug = 'banking'))
ON CONFLICT DO NOTHING;

-- Topic: post_office
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Haluaisin lähettää kirjeen Saksaan.', 'Mä haluisin lähettää kirjeen Saksaan.', 'I would like to send a letter to Germany.', 'A1', (SELECT id FROM topics WHERE slug = 'post_office')),
  ('Paketti saapui postiin.', 'Paketti saapui postiin.', 'The parcel arrived at the post office.', 'A1', (SELECT id FROM topics WHERE slug = 'post_office')),
  ('Ilmoituskortti postista löytyy postilaatikosta.', 'Ilmoituskortti postista löytyy postilaatikosta.', 'The post office notice card is in the letterbox.', 'A1', (SELECT id FROM topics WHERE slug = 'post_office')),
  ('Noutaakseni paketin tarvitsen henkilöllisyystodistuksen.', 'Mä tarviin henkilöllisyystodistuksen ku mä noutan paketin.', 'I need an identity document to pick up the parcel.', 'A1', (SELECT id FROM topics WHERE slug = 'post_office')),
  ('Postimerkin hinta on yksi euro.', 'Postimerkin hinta on yks euro.', 'The price of a stamp is one euro.', 'A1', (SELECT id FROM topics WHERE slug = 'post_office')),
  ('Paljonko maksaa kirjattu kirje?', 'Paljonko maksaa kirjattu kirje?', 'How much does a registered letter cost?', 'A1', (SELECT id FROM topics WHERE slug = 'post_office')),
  ('Postikonttori on auki arkisin kahdeksasta kuuteen.', 'Postikonttori on auki arkisin kahdeksasta kuuteen.', 'The post office is open on weekdays from eight to six.', 'A1', (SELECT id FROM topics WHERE slug = 'post_office')),
  ('OmaPosti-palvelussa voi seurata lähetystä.', 'OmaPosti-palvelussa voi seurata lähetystä.', 'You can track a shipment in the OmaPosti service.', 'A1', (SELECT id FROM topics WHERE slug = 'post_office')),
  ('Postipaketti toimitetaan yleensä yhden kahden päivän kuluessa.', 'Postipaketti toimitetaan yleensä yhden kahden päivän kuluessa.', 'A postal parcel is usually delivered within one or two days.', 'A1', (SELECT id FROM topics WHERE slug = 'post_office')),
  ('Osoitteenmuutos ilmoitetaan postille.', 'Osoitteenmuutos ilmoitetaan postille.', 'A change of address is notified to the post.', 'A1', (SELECT id FROM topics WHERE slug = 'post_office')),
  ('Pakettiautomaatista voi noutaa paketin mihin aikaan tahansa.', 'Pakettiautomaatista voi noutaa paketin mihin aikaan tahansa.', 'You can collect a parcel from a parcel locker at any time.', 'A2', (SELECT id FROM topics WHERE slug = 'post_office')),
  ('Kirjattu lähetys vaatii vastaanottajan allekirjoituksen.', 'Kirjattu lähetys vaatii vastaanottajan allekirjoituksen.', 'A registered shipment requires the recipient''s signature.', 'A2', (SELECT id FROM topics WHERE slug = 'post_office')),
  ('Postiautomaatin koodi löytyy tekstiviestistä.', 'Postiautomaatin koodi löytyy tekstiviestistä.', 'The parcel locker code can be found in the text message.', 'A2', (SELECT id FROM topics WHERE slug = 'post_office')),
  ('Ulkomaille lähetettävän paketin tullausarvo pitää ilmoittaa.', 'Ulkomaille lähetettävän paketin tullausarvo pitää ilmottaa.', 'The customs value of a parcel sent abroad must be declared.', 'A2', (SELECT id FROM topics WHERE slug = 'post_office')),
  ('Postin kotiinkuljetus ei kuulu normaaliin palveluun.', 'Postin kotiinkuljetus ei kuulu normaaliin palveluun.', 'Home delivery of post is not part of the standard service.', 'A2', (SELECT id FROM topics WHERE slug = 'post_office')),
  ('Lähetysnumero löytyy tilausvahvistuksesta.', 'Lähetysnumero löytyy tilausvahvistuksesta.', 'The tracking number can be found in the order confirmation.', 'A2', (SELECT id FROM topics WHERE slug = 'post_office')),
  ('Hyvä pakkaus estää tavaroita vahingoittumasta.', 'Hyvä pakkaus estää tavaroita vahingoittumasta.', 'Good packaging prevents goods from being damaged.', 'A2', (SELECT id FROM topics WHERE slug = 'post_office')),
  ('Poste restante -lähetys noudetaan postitoimistosta henkilökohtaisesti.', 'Poste restante -lähetys noudetaan postitoimistosta henkilökohtaisesti.', 'A poste restante parcel is collected from the post office in person.', 'A2', (SELECT id FROM topics WHERE slug = 'post_office')),
  ('Lähettäjän osoite kirjoitetaan kirjeen taakse.', 'Lähettäjän osoite kirjoitetaan kirjeen taakse.', 'The sender''s address is written on the back of the envelope.', 'A2', (SELECT id FROM topics WHERE slug = 'post_office')),
  ('Ilmainen palautus toimii printattavan etiketin avulla.', 'Ilmainen palautus toimii printattavan etiketin avulla.', 'Free return works using a printable label.', 'A2', (SELECT id FROM topics WHERE slug = 'post_office'))
ON CONFLICT DO NOTHING;

-- Topic: housing_services
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Hain sosiaaliasunnon kaupungilta.', 'Mä hain sosiaaliasunnon kaupungilta.', 'I applied for a social housing apartment from the city.', 'A1', (SELECT id FROM topics WHERE slug = 'housing_services')),
  ('Asumistuki maksetaan suoraan tilille.', 'Asumistuki maksetaan suoraan tilille.', 'The housing benefit is paid directly to the account.', 'A1', (SELECT id FROM topics WHERE slug = 'housing_services')),
  ('Vuokranantajan yhteystiedot ovat sopimuksessa.', 'Vuokranantajan yhteystiedot on sopimuksessa.', 'The landlord''s contact details are in the contract.', 'A1', (SELECT id FROM topics WHERE slug = 'housing_services')),
  ('Isännöitsijä vastaa taloyhtiön asioista.', 'Isännöitsijä vastaa taloyhtiön asioista.', 'The property manager is responsible for the housing company''s matters.', 'A1', (SELECT id FROM topics WHERE slug = 'housing_services')),
  ('Asunnon tarkastuspöytäkirja tehdään sisäänmuuttaessa.', 'Asunnon tarkastuspöytäkirja tehdään ku muutetaan sisään.', 'The apartment inspection report is done when moving in.', 'A1', (SELECT id FROM topics WHERE slug = 'housing_services')),
  ('Kaupungin vuokra-asuntoon voi hakea netissä.', 'Kaupungin vuokra-asuntoon voi hakee netissä.', 'You can apply for a city rental apartment online.', 'A1', (SELECT id FROM topics WHERE slug = 'housing_services')),
  ('Takuuvuokra maksetaan ennen muuttoa.', 'Takuuvuokra maksetaan ennen muuttoo.', 'The security deposit is paid before moving in.', 'A1', (SELECT id FROM topics WHERE slug = 'housing_services')),
  ('Sähköyhtiö vaihdetaan uuteen kotiin muuttaessa.', 'Sähköyhtiö vaihdetaan ku muutetaan uuteen kotiin.', 'The electricity company is changed when moving to a new home.', 'A1', (SELECT id FROM topics WHERE slug = 'housing_services')),
  ('Naapurin häiritsevästä melusta voi valittaa.', 'Naapurin häiritsevästä melusta voi valittaa.', 'You can complain about a disturbing neighbour''s noise.', 'A1', (SELECT id FROM topics WHERE slug = 'housing_services')),
  ('Asunnon vuokrasopimus irtisanotaan kirjallisesti.', 'Asunnon vuokrasopimus irtisanotaan kirjallisesti.', 'The rental agreement is terminated in writing.', 'A1', (SELECT id FROM topics WHERE slug = 'housing_services')),
  ('Asumistukihakemus tehdään Kelan verkkopalvelussa.', 'Asumistukihakemus tehdään Kelan verkkopalvelussa.', 'The housing benefit application is made on Kela''s online service.', 'A2', (SELECT id FROM topics WHERE slug = 'housing_services')),
  ('Talkoissa naapurit siivoavat piha-alueen yhdessä.', 'Talkoissa naapurit siivoo piha-alueen yhdessä.', 'At a community day the neighbours clean the yard area together.', 'A2', (SELECT id FROM topics WHERE slug = 'housing_services')),
  ('Arava-asunnossa on tulorajat asukkaille.', 'Arava-asunnossa on tulorajat asukkaille.', 'An Arava apartment has income limits for residents.', 'A2', (SELECT id FROM topics WHERE slug = 'housing_services')),
  ('Kuntosali ja sauna ovat asukkaiden yhteisessä käytössä.', 'Kuntosali ja sauna on asukkaiden yhteisessä käytössä.', 'The gym and sauna are for shared use by residents.', 'A2', (SELECT id FROM topics WHERE slug = 'housing_services')),
  ('Taloyhtiön yhtiökokous pidetään vuosittain.', 'Taloyhtiön yhtiökokous pidetään vuosittain.', 'The housing company general meeting is held annually.', 'A2', (SELECT id FROM topics WHERE slug = 'housing_services')),
  ('Muuttotarkastuksessa katsotaan asunnon kunto.', 'Muuttotarkastuksessa katsotaan asunnon kunto.', 'The move-out inspection checks the condition of the apartment.', 'A2', (SELECT id FROM topics WHERE slug = 'housing_services')),
  ('Vesimittarin lukema ilmoitetaan taloyhtiölle.', 'Vesimittarin lukema ilmoitetaan taloyhtiölle.', 'The water meter reading is reported to the housing company.', 'A2', (SELECT id FROM topics WHERE slug = 'housing_services')),
  ('Pesutuvan varaus tehdään taloyhtiön varauskirjaan.', 'Pesutuvan varaus tehdään taloyhtiön varauskirjaan.', 'The laundry room is booked in the housing company reservation book.', 'A2', (SELECT id FROM topics WHERE slug = 'housing_services')),
  ('Huoltoyhtiö hoitaa pienet korjaukset.', 'Huoltoyhtiö hoitaa pienet korjaukset.', 'The maintenance company handles minor repairs.', 'A2', (SELECT id FROM topics WHERE slug = 'housing_services')),
  ('Asuntovakuutus kannattaa ottaa heti muuttaessa.', 'Asuntovakuutus kannattaa ottaa heti ku muuttaa.', 'It is worth taking out home insurance immediately when moving.', 'A2', (SELECT id FROM topics WHERE slug = 'housing_services'))
ON CONFLICT DO NOTHING;

-- Topic: emergency
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Soita hätänumeroon 112.', 'Soita hätänumeroon 112.', 'Call the emergency number 112.', 'A1', (SELECT id FROM topics WHERE slug = 'emergency')),
  ('Tarvitsen apua, soittakaa ambulanssi!', 'Mä tarviin apua, soittakaa ambulanssi!', 'I need help, call an ambulance!', 'A1', (SELECT id FROM topics WHERE slug = 'emergency')),
  ('Missä on lähin sairaala?', 'Missä on lähin sairaala?', 'Where is the nearest hospital?', 'A1', (SELECT id FROM topics WHERE slug = 'emergency')),
  ('Tulipalo! Poistukaa rakennuksesta!', 'Tulipalo! Menkää ulos rakennuksesta!', 'Fire! Get out of the building!', 'A1', (SELECT id FROM topics WHERE slug = 'emergency')),
  ('Lompakkoni on varastettu.', 'Mun lompakko on varastettu.', 'My wallet has been stolen.', 'A1', (SELECT id FROM topics WHERE slug = 'emergency')),
  ('Tarvitsen poliisia.', 'Mä tarviin poliisia.', 'I need the police.', 'A1', (SELECT id FROM topics WHERE slug = 'emergency')),
  ('En pysty hengittämään kunnolla.', 'Mä en pysty hengittää kunnolla.', 'I cannot breathe properly.', 'A1', (SELECT id FROM topics WHERE slug = 'emergency')),
  ('Kaaduin ja sattuu kovasti jalkaan.', 'Mä kaaduin ja jalkaa sattuu tosi kovaa.', 'I fell and my leg hurts a lot.', 'A1', (SELECT id FROM topics WHERE slug = 'emergency')),
  ('Lapsi on eksynyt.', 'Lapsi on eksynyt.', 'A child is lost.', 'A1', (SELECT id FROM topics WHERE slug = 'emergency')),
  ('Hälytysajoneuvot tulevat, pysy rauhallisena.', 'Hälytysajoneuvot tulee, pysy rauhallisena.', 'Emergency vehicles are coming, stay calm.', 'A1', (SELECT id FROM topics WHERE slug = 'emergency')),
  ('Ensiapuohjeet löytyvät hätäensiapusovelluksesta.', 'Ensiapuohjeet löytyy hätäensiapusovelluksesta.', 'First aid instructions can be found in the first aid app.', 'A2', (SELECT id FROM topics WHERE slug = 'emergency')),
  ('Kerro hätäkeskukselle tarkka osoite.', 'Kerro hätäkeskukselle tarkka osoite.', 'Tell the emergency centre the exact address.', 'A2', (SELECT id FROM topics WHERE slug = 'emergency')),
  ('Poistumisohjeet ovat seinällä jokaisessa kerroksessa.', 'Poistumisohjeet on seinällä jokaisessa kerroksessa.', 'Evacuation instructions are on the wall on every floor.', 'A2', (SELECT id FROM topics WHERE slug = 'emergency')),
  ('Löysin vamman joka vaatii ensiapua.', 'Mä löysin vamman joka vaatii ensiapua.', 'I found an injury that requires first aid.', 'A2', (SELECT id FROM topics WHERE slug = 'emergency')),
  ('Hätäkeskuksessa puhutaan myös englanniksi.', 'Hätäkeskuksessa puhutaan myös englanniksi.', 'The emergency centre also operates in English.', 'A2', (SELECT id FROM topics WHERE slug = 'emergency')),
  ('Palohälytin soi kesken yön.', 'Palohälytin soi kesken yön.', 'The fire alarm went off in the middle of the night.', 'A2', (SELECT id FROM topics WHERE slug = 'emergency')),
  ('Lähimmäinen tarvitsi apua kaatumisen jälkeen.', 'Lähimmäinen tarvitsi apua kaatumisen jälkeen.', 'A neighbour needed help after falling.', 'A2', (SELECT id FROM topics WHERE slug = 'emergency')),
  ('Rikoksen uhri voi hakea apua rikosuhripäivystyksestä.', 'Rikoksen uhri voi hakea apua rikosuhripäivystyksestä.', 'A crime victim can seek help from the victim support service.', 'A2', (SELECT id FROM topics WHERE slug = 'emergency')),
  ('Kotivakuutus korvaa varkausvahingot.', 'Kotivakuutus korvaa varkausvahingot.', 'Home insurance covers theft damage.', 'A2', (SELECT id FROM topics WHERE slug = 'emergency')),
  ('Palosammutin löytyy jokaisen kerroksen aulasta.', 'Palosammutin löytyy jokaisen kerroksen aulasta.', 'A fire extinguisher can be found in the entrance hall of every floor.', 'A2', (SELECT id FROM topics WHERE slug = 'emergency'))
ON CONFLICT DO NOTHING;

-- Topic: city_life
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Kaupungin keskustassa on paljon palveluja.', 'Kaupungin keskustassa on paljon palveluja.', 'The city centre has many services.', 'A1', (SELECT id FROM topics WHERE slug = 'city_life')),
  ('Tori on vilkas aamulla.', 'Tori on vilkas aamulla.', 'The market square is busy in the morning.', 'A1', (SELECT id FROM topics WHERE slug = 'city_life')),
  ('Kaupungissa on hyvät julkiset liikenneyhteydet.', 'Kaupungissa on hyvät julkiset liikenneyhteydet.', 'The city has good public transport links.', 'A1', (SELECT id FROM topics WHERE slug = 'city_life')),
  ('Kirjasto on ilmainen kaikille asukkaille.', 'Kirjasto on ilmainen kaikille asukkaille.', 'The library is free for all residents.', 'A1', (SELECT id FROM topics WHERE slug = 'city_life')),
  ('Kaupunginpuistossa on leikkipaikka lapsille.', 'Kaupunginpuistossa on leikkipaikka lapsille.', 'The city park has a playground for children.', 'A1', (SELECT id FROM topics WHERE slug = 'city_life')),
  ('Ravintolat aukeavat yleensä yhdeltatoista.', 'Ravintolat aukee yleensä yhdeltatoista.', 'Restaurants usually open at eleven.', 'A1', (SELECT id FROM topics WHERE slug = 'city_life')),
  ('Kierrätyspiste on kadun kulmassa.', 'Kierrätyspiste on kadun kulmassa.', 'The recycling point is on the street corner.', 'A1', (SELECT id FROM topics WHERE slug = 'city_life')),
  ('Kaupunki tarjoaa ilmaisia kulttuuritapahtumia.', 'Kaupunki tarjoaa ilmaisia kulttuuritapahtumia.', 'The city offers free cultural events.', 'A1', (SELECT id FROM topics WHERE slug = 'city_life')),
  ('Lähin uimahalli on kilometrin päässä.', 'Lähin uimahalli on kilometrin päässä.', 'The nearest swimming hall is one kilometre away.', 'A1', (SELECT id FROM topics WHERE slug = 'city_life')),
  ('Katuvalaistus menee päälle iltahämärässä.', 'Katuvalaistus menee päälle iltahämärässä.', 'Street lights come on at dusk.', 'A1', (SELECT id FROM topics WHERE slug = 'city_life')),
  ('Naapurustossa järjestetään talkoita keväisin.', 'Naapurustossa järjestetään talkoita keväisin.', 'Community clean-up days are organised in the neighbourhood in spring.', 'A2', (SELECT id FROM topics WHERE slug = 'city_life')),
  ('Kaupunki rakentaa uuden kevyen liikenteen väylän.', 'Kaupunki rakentaa uuden pyörätien.', 'The city is building a new cycle path.', 'A2', (SELECT id FROM topics WHERE slug = 'city_life')),
  ('Asukastoimikunta kokoontuu kerran kuussa.', 'Asukastoimikunta kokoontuu kerran kuussa.', 'The residents'' committee meets once a month.', 'A2', (SELECT id FROM topics WHERE slug = 'city_life')),
  ('Kaupungin sivuilla on palvelukartta.', 'Kaupungin sivuilla on palvelukartta.', 'The city website has a service map.', 'A2', (SELECT id FROM topics WHERE slug = 'city_life')),
  ('Kierrätys on tärkeä osa kaupungin ympäristötyötä.', 'Kierrätys on tärkeä osa kaupungin ympäristötyötä.', 'Recycling is an important part of the city''s environmental work.', 'A2', (SELECT id FROM topics WHERE slug = 'city_life')),
  ('Korttelitalo tarjoaa kaikille asukkaille kohtaamispaikan.', 'Korttelitalo tarjoaa kaikille asukkaille kohtaamispaikan.', 'The neighbourhood house provides a meeting place for all residents.', 'A2', (SELECT id FROM topics WHERE slug = 'city_life')),
  ('Ilmoitustaululla on tietoja alueen tapahtumista.', 'Ilmoitustaululla on tietoja alueen tapahtumista.', 'The notice board has information about events in the area.', 'A2', (SELECT id FROM topics WHERE slug = 'city_life')),
  ('Kaupunki on asukasystävällisempi kuin koskaan ennen.', 'Kaupunki on asukasystävällisempi ku koskaan ennen.', 'The city is more resident-friendly than ever before.', 'A2', (SELECT id FROM topics WHERE slug = 'city_life')),
  ('Kamppi-kauppakeskus on Helsingin ydinkeskustassa.', 'Kamppi-kauppakeskus on Helsingin ydinkeskustassa.', 'Kamppi shopping centre is in the very heart of Helsinki.', 'A2', (SELECT id FROM topics WHERE slug = 'city_life')),
  ('Kesällä kaupunki täyttyy turisteista.', 'Kesällä kaupunki täyttyy turisteista.', 'In summer the city fills with tourists.', 'A2', (SELECT id FROM topics WHERE slug = 'city_life'))
ON CONFLICT DO NOTHING;

-- Topic: media_news
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Katson uutiset joka ilta televisiosta.', 'Mä katson uutiset joka ilta televisiosta.', 'I watch the news on TV every evening.', 'A1', (SELECT id FROM topics WHERE slug = 'media_news')),
  ('Yle on Suomen julkinen yleisradioyhtiö.', 'Yle on Suomen julkinen yleisradioyhtiö.', 'Yle is Finland''s public broadcasting company.', 'A1', (SELECT id FROM topics WHERE slug = 'media_news')),
  ('Luen uutiset puhelimesta aamulla.', 'Mä luen uutiset puhelimesta aamulla.', 'I read the news on my phone in the morning.', 'A1', (SELECT id FROM topics WHERE slug = 'media_news')),
  ('Sanomalehti toimitetaan kotiin joka aamu.', 'Sanomalehti toimitetaan kotiin joka aamu.', 'The newspaper is delivered home every morning.', 'A1', (SELECT id FROM topics WHERE slug = 'media_news')),
  ('Radio soi taustalla töissä.', 'Radio soi taustalla töissä.', 'The radio plays in the background at work.', 'A1', (SELECT id FROM topics WHERE slug = 'media_news')),
  ('Verkkolehden voi lukea ilmaiseksi.', 'Verkkolehden voi lukea ilmaseksi.', 'The online paper can be read for free.', 'A1', (SELECT id FROM topics WHERE slug = 'media_news')),
  ('Otin digitaalisen lehtitilauksen.', 'Mä otin digitaalisen lehtitilauksen.', 'I took out a digital newspaper subscription.', 'A1', (SELECT id FROM topics WHERE slug = 'media_news')),
  ('Uutisissa kerrotaan tärkeimmistä tapahtumista.', 'Uutisissa kerrotaan tärkeimmistä tapahtumista.', 'The news reports on the most important events.', 'A1', (SELECT id FROM topics WHERE slug = 'media_news')),
  ('Podcast on hyvä tapa oppia suomea.', 'Podcast on hyvä tapa oppia suomee.', 'A podcast is a good way to learn Finnish.', 'A1', (SELECT id FROM topics WHERE slug = 'media_news')),
  ('Sosiaalisen median kautta leviää myös väärää tietoa.', 'Somen kautta leviää myös väärää tietoa.', 'False information also spreads through social media.', 'A1', (SELECT id FROM topics WHERE slug = 'media_news')),
  ('Yle Uutiset selkosuomeksi on hyödyllinen kielenoppijoille.', 'Yle Uutiset selkosuomeksi on hyödyllinen kielenoppijoille.', 'Yle News in plain Finnish is useful for language learners.', 'A2', (SELECT id FROM topics WHERE slug = 'media_news')),
  ('Suomessa lehdistönvapaus on erittäin hyvällä tasolla.', 'Suomessa lehdistönvapaus on erittäin hyvällä tasolla.', 'In Finland press freedom is at a very high level.', 'A2', (SELECT id FROM topics WHERE slug = 'media_news')),
  ('Toimittaja haastatteli ministeristä.', 'Toimittaja haastatteli ministeriä.', 'The journalist interviewed the minister.', 'A2', (SELECT id FROM topics WHERE slug = 'media_news')),
  ('Uutisvinkin voi lähettää toimitukseen sähköpostilla.', 'Uutisvinkistä voi lähettää toimitukselle sähköpostilla.', 'A news tip can be sent to the editorial office by email.', 'A2', (SELECT id FROM topics WHERE slug = 'media_news')),
  ('Kommenttikentässä esiintyy usein asiatonta kirjoittelua.', 'Kommenttikentässä esiintyy usein asiatonta kirjoittelua.', 'Inappropriate writing often appears in comment sections.', 'A2', (SELECT id FROM topics WHERE slug = 'media_news')),
  ('Vaaliuutisointi alkaa jo ennen vaaleja.', 'Vaaliuutisointi alkaa jo ennen vaaleja.', 'Election coverage starts already before the elections.', 'A2', (SELECT id FROM topics WHERE slug = 'media_news')),
  ('Dokumenttiohjelmat ovat suosittuja Ylellä.', 'Dokumenttiohjelmat on suosittuja Ylellä.', 'Documentary programmes are popular on Yle.', 'A2', (SELECT id FROM topics WHERE slug = 'media_news')),
  ('Uutiskirje tulee sähköpostiin viikoittain.', 'Uutiskirje tulee sähköpostiin viikoittain.', 'The newsletter arrives in the email weekly.', 'A2', (SELECT id FROM topics WHERE slug = 'media_news')),
  ('Hakukoneen avulla löydät luotettavia lähteitä.', 'Hakukoneen avulla löydät luotettavia lähteitä.', 'Using a search engine you can find reliable sources.', 'A2', (SELECT id FROM topics WHERE slug = 'media_news')),
  ('Kriittinen medialukutaito on tärkeä taito.', 'Kriittinen medialukutaito on tärkeä taito.', 'Critical media literacy is an important skill.', 'A2', (SELECT id FROM topics WHERE slug = 'media_news'))
ON CONFLICT DO NOTHING;

-- Topic: integration
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Kotoutumissuunnitelma tehdään TE-toimistossa.', 'Kotoutumissuunnitelma tehdään TE-toimistossa.', 'The integration plan is made at the employment office.', 'A1', (SELECT id FROM topics WHERE slug = 'integration')),
  ('Kotouttamiskoulutus on kolme vuotta pitkä.', 'Kotouttamiskoulutus on kolme vuotta pitkä.', 'The integration training lasts three years.', 'A1', (SELECT id FROM topics WHERE slug = 'integration')),
  ('Opiskelen suomea ilmaisessa kurssilla.', 'Mä opiskelen suomee ilmasella kurssilla.', 'I study Finnish on a free course.', 'A1', (SELECT id FROM topics WHERE slug = 'integration')),
  ('Kela maksaa perustoimeentulotukea.', 'Kela maksaa perustoimeentulotukea.', 'Kela pays the basic income support.', 'A1', (SELECT id FROM topics WHERE slug = 'integration')),
  ('Maistraatissa haetaan henkilötunnus.', 'Maistraatissa haetaan henkilötunnus.', 'A personal identity code is applied for at the register office.', 'A1', (SELECT id FROM topics WHERE slug = 'integration')),
  ('Suomessa on hyvä terveydenhuolto kaikille asukkaille.', 'Suomessa on hyvä terveydenhuolto kaikille asukkaille.', 'Finland has good healthcare for all residents.', 'A1', (SELECT id FROM topics WHERE slug = 'integration')),
  ('Vapaaehtoistyö auttaa tutustumaan suomalaisiin.', 'Vapaaehtoistyö auttaa tutustumaan suomalaisiin.', 'Volunteer work helps you get to know Finns.', 'A1', (SELECT id FROM topics WHERE slug = 'integration')),
  ('Uusille asukkaille järjestetään infotilaisuus.', 'Uusille asukkaille järjestetään infotilaisuus.', 'An information session is organised for new residents.', 'A1', (SELECT id FROM topics WHERE slug = 'integration')),
  ('Suomen kielen taito avaa ovia työelämässä.', 'Suomen kielen taito avaa ovia työelämässä.', 'Finnish language skills open doors in working life.', 'A1', (SELECT id FROM topics WHERE slug = 'integration')),
  ('Monikulttuurisessa kaupungissa on paljon eri kieliä.', 'Monikulttuurisessa kaupungissa on paljon eri kieliä.', 'In a multicultural city there are many different languages.', 'A1', (SELECT id FROM topics WHERE slug = 'integration')),
  ('Kotoutumisohjelma pitää sisällään kielen, työn ja yhteiskuntatietouden.', 'Kotoutumisohjelma pitää sisällään kielen, työn ja yhteiskuntatietouden.', 'The integration programme includes language, work and civic knowledge.', 'A2', (SELECT id FROM topics WHERE slug = 'integration')),
  ('Tulkki on mukana viranomaistapaamisissa tarvittaessa.', 'Tulkki on mukana viranomaistapaamisissa tarvittaessa.', 'An interpreter is present at official meetings when needed.', 'A2', (SELECT id FROM topics WHERE slug = 'integration')),
  ('Suomalaiseen kulttuuriin totuttautuminen vie aikaa.', 'Suomalaiseen kulttuuriin totuttautuminen vie aikaa.', 'Getting used to Finnish culture takes time.', 'A2', (SELECT id FROM topics WHERE slug = 'integration')),
  ('Järjestöt tarjoavat tukea maahanmuuttajille.', 'Järjestöt tarjoaa tukea maahanmuuttajille.', 'Organisations offer support to immigrants.', 'A2', (SELECT id FROM topics WHERE slug = 'integration')),
  ('Ensimmäinen vuosi uudessa maassa on kaikkein haastavin.', 'Ensimmäinen vuosi uudessa maassa on kaikkein haastavin.', 'The first year in a new country is the most challenging.', 'A2', (SELECT id FROM topics WHERE slug = 'integration')),
  ('Suomalaisessa viestintäkulttuurissa suoruus on hyve.', 'Suomalaisessa viestintäkulttuurissa suoruus on hyve.', 'In Finnish communication culture directness is a virtue.', 'A2', (SELECT id FROM topics WHERE slug = 'integration')),
  ('Infopankki.fi tarjoaa tietoa monilla kielillä.', 'Infopankki.fi tarjoaa tietoa monilla kielillä.', 'Infopankki.fi provides information in many languages.', 'A2', (SELECT id FROM topics WHERE slug = 'integration')),
  ('Kaksikielinen perhe tukee lasten identiteettiä.', 'Kaksikielinen perhe tukee lasten identiteettiä.', 'A bilingual family supports children''s identity.', 'A2', (SELECT id FROM topics WHERE slug = 'integration')),
  ('Suomalaiset ovat yleensä rauhallisia ja pidättyväisiä.', 'Suomalaiset on yleensä rauhallisia ja pidättyväisiä.', 'Finns are generally calm and reserved.', 'A2', (SELECT id FROM topics WHERE slug = 'integration')),
  ('Kotoutuminen on molemminpuolinen prosessi.', 'Kotoutuminen on molemminpuolinen prosessi.', 'Integration is a two-way process.', 'A2', (SELECT id FROM topics WHERE slug = 'integration'))
ON CONFLICT DO NOTHING;

-- Topic: rights_duties
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Jokaisella Suomessa asuvalla on oikeus terveydenhuoltoon.', 'Jokaisella Suomessa asuvalla on oikeus terveydenhuoltoon.', 'Everyone living in Finland has the right to healthcare.', 'A1', (SELECT id FROM topics WHERE slug = 'rights_duties')),
  ('Lasten koulunkäynti on pakollista.', 'Lasten koulunkäynti on pakollista.', 'School attendance is compulsory for children.', 'A1', (SELECT id FROM topics WHERE slug = 'rights_duties')),
  ('Jätteet lajitellaan erikseen.', 'Jätteet lajitellaan erikseen.', 'Waste is sorted separately.', 'A1', (SELECT id FROM topics WHERE slug = 'rights_duties')),
  ('Äänestäminen on kansalaisen oikeus.', 'Äänestäminen on kansalaisen oikeus.', 'Voting is a citizen''s right.', 'A1', (SELECT id FROM topics WHERE slug = 'rights_duties')),
  ('Verojen maksaminen on pakollista.', 'Verojen maksaminen on pakollista.', 'Paying taxes is mandatory.', 'A1', (SELECT id FROM topics WHERE slug = 'rights_duties')),
  ('Kaikki ovat lain edessä tasa-arvoisia.', 'Kaikki on lain edessä tasa-arvoisia.', 'Everyone is equal before the law.', 'A1', (SELECT id FROM topics WHERE slug = 'rights_duties')),
  ('Syrjintä on kielletty lain mukaan.', 'Syrjintä on kielletty lain mukaan.', 'Discrimination is prohibited by law.', 'A1', (SELECT id FROM topics WHERE slug = 'rights_duties')),
  ('Jokainen voi uskoa vapaasti.', 'Jokainen voi uskoa vapaasti.', 'Everyone can believe freely.', 'A1', (SELECT id FROM topics WHERE slug = 'rights_duties')),
  ('Suomessa on sananvapaus.', 'Suomessa on sananvapaus.', 'There is freedom of speech in Finland.', 'A1', (SELECT id FROM topics WHERE slug = 'rights_duties')),
  ('Pysyvä oleskelulupa myönnetään neljän vuoden jälkeen.', 'Pysyvä oleskelulupa myönnetään neljän vuoden jälkeen.', 'A permanent residence permit is granted after four years.', 'A1', (SELECT id FROM topics WHERE slug = 'rights_duties')),
  ('Työsopimukseen kirjataan kaikki sovitut ehdot.', 'Työsopimukseen kirjataan kaikki sovitut ehdot.', 'All agreed terms are written into the employment contract.', 'A2', (SELECT id FROM topics WHERE slug = 'rights_duties')),
  ('Oleskelulupahakemus jätetään Migri.fi-palvelussa.', 'Oleskelulupahakemus jätetään Migri.fi-palvelussa.', 'The residence permit application is submitted on the Migri.fi service.', 'A2', (SELECT id FROM topics WHERE slug = 'rights_duties')),
  ('Yhdenvertaisuuslaki suojelee maahanmuuttajia syrjinnältä.', 'Yhdenvertaisuuslaki suojelee maahanmuuttajia syrjinnältä.', 'The Equality Act protects immigrants from discrimination.', 'A2', (SELECT id FROM topics WHERE slug = 'rights_duties')),
  ('Lapsiperheillä on oikeus lapsilisään.', 'Lapsiperheillä on oikeus lapsilisään.', 'Families with children are entitled to child benefit.', 'A2', (SELECT id FROM topics WHERE slug = 'rights_duties')),
  ('Muistathan äänestää kuntavaaleissa.', 'Muistathan äänestää kuntavaaleissa.', 'Remember to vote in the municipal elections.', 'A2', (SELECT id FROM topics WHERE slug = 'rights_duties')),
  ('Oikeusapu on maksutonta pienituloisille.', 'Oikeusapu on maksutonta pienituloisille.', 'Legal aid is free for low-income people.', 'A2', (SELECT id FROM topics WHERE slug = 'rights_duties')),
  ('Tietosuoja-asetus suojelee henkilötietoja.', 'Tietosuoja-asetus suojelee henkilötietoja.', 'The data protection regulation protects personal data.', 'A2', (SELECT id FROM topics WHERE slug = 'rights_duties')),
  ('Rikoksen uhri saa oikeusapua ja tukea.', 'Rikoksen uhri saa oikeusapua ja tukea.', 'A crime victim receives legal aid and support.', 'A2', (SELECT id FROM topics WHERE slug = 'rights_duties')),
  ('Kansalaisuutta haetaan asumisen perusteella.', 'Kansalaisuutta haetaan asumisen perusteella.', 'Citizenship is applied for on the basis of residence.', 'A2', (SELECT id FROM topics WHERE slug = 'rights_duties')),
  ('Perustuslaki takaa kaikille perusoikeudet.', 'Perustuslaki takaa kaikille perusoikeudet.', 'The constitution guarantees fundamental rights for all.', 'A2', (SELECT id FROM topics WHERE slug = 'rights_duties'))
ON CONFLICT DO NOTHING;

-- Topic: yki_exam_prep
INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('YKI-koe on neliosainen.', 'YKI-koe on neliosainen.', 'The YKI exam has four parts.', 'A1', (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
  ('Kokeessa testataan kuullun ymmärtämistä.', 'Kokeessa testataan kuullun ymmärtämistä.', 'The exam tests listening comprehension.', 'A1', (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
  ('Kirjoitustehtävässä kirjoitetaan lyhyt viesti.', 'Kirjoitustehtävässä kirjoitetaan lyhyt viesti.', 'In the writing task a short message is written.', 'A1', (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
  ('Puhetehtävässä vastataan ääneen.', 'Puhetehtävässä vastataan ääneen.', 'In the speaking task answers are given aloud.', 'A1', (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
  ('B1-taso riittää oleskelulupaan.', 'B1-taso riittää oleskelulupaan.', 'B1 level is enough for the residence permit.', 'A1', (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
  ('Kokeeseen ilmoittaudutaan netissä.', 'Kokeeseen ilmottaudutaan netissä.', 'Registration for the exam is done online.', 'A1', (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
  ('Kokeen hinta on noin sata euroa.', 'Kokeen hinta on noin sata euroa.', 'The exam costs about one hundred euros.', 'A1', (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
  ('Tulokset saapuvat kuukauden kuluessa.', 'Tulokset saapuu kuukauden kuluessa.', 'Results arrive within a month.', 'A1', (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
  ('Kielikoetta voi uusia tarvittaessa.', 'Kielikoetta voi uusia tarvittaessa.', 'The language test can be retaken if needed.', 'A1', (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
  ('Luvun ymmärtämistehtävässä luetaan teksti ja vastataan kysymyksiin.', 'Luvun ymmärtämistehtävässä luetaan teksti ja vastataan kysymyksiin.', 'In the reading comprehension task a text is read and questions answered.', 'A1', (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
  ('YKI-koetta harjoitellaan kuuntelemalla suomalaisia uutisia.', 'YKI-koetta harjoitellaan kuuntelemalla suomalaisia uutisia.', 'The YKI exam is practised by listening to Finnish news.', 'A2', (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
  ('Kirjoitustehtävässä on tärkeää noudattaa ohjepituutta.', 'Kirjoitustehtävässä on tärkeää noudattaa ohjepituutta.', 'In the writing task it is important to follow the recommended length.', 'A2', (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
  ('Suulliseen kokeeseen kannattaa valmistautua kertomalla arjesta.', 'Suulliseen kokeeseen kannattaa valmistautuu kertomalla arjesta.', 'The oral exam is best prepared for by talking about everyday life.', 'A2', (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
  ('Selkeitä virheitä kannattaa välttää, mutta täydellisyyttä ei vaadita.', 'Selkeitä virheitä kannattaa välttää, mut täydellisyyttä ei vaadita.', 'Clear errors are worth avoiding, but perfection is not required.', 'A2', (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
  ('Sanavarasto on tärkeämpi kuin kielioppisäännöt kokeessa.', 'Sanavarasto on tärkeämpi ku kielioppisäännöt kokeessa.', 'Vocabulary is more important than grammar rules in the exam.', 'A2', (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
  ('Harjoituskokeita löytyy Opetushallituksen sivuilta.', 'Harjoituskokeita löytyy Opetushallituksen sivuilta.', 'Practice exams can be found on the Finnish National Agency for Education website.', 'A2', (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
  ('Arviointiasteikko menee tasolta A1 tasolle C2.', 'Arviointiasteikko menee tasolta A1 tasolle C2.', 'The assessment scale goes from level A1 to level C2.', 'A2', (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
  ('Kokeessa arvioidaan myös viestintästrategioita.', 'Kokeessa arvioidaan myös viestintästrategioita.', 'Communication strategies are also assessed in the exam.', 'A2', (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
  ('Koeaika on yhteensä neljä tuntia.', 'Koeaika on yhteensä neljä tuntia.', 'The total exam time is four hours.', 'A2', (SELECT id FROM topics WHERE slug = 'yki_exam_prep')),
  ('Kokeen läpäisyyn vaaditaan riittävä pistemäärä jokaisesta osiosta.', 'Kokeen läpäisyyn vaaditaan riittävä pistemäärä jokaisesta osiosta.', 'A sufficient score in each section is required to pass the exam.', 'A2', (SELECT id FROM topics WHERE slug = 'yki_exam_prep'))
ON CONFLICT DO NOTHING;
-- Day One Sprint mnemonics
-- 180 high-frequency words with sound-bridge memory aids.
INSERT INTO mnemonics (word_id, text, is_public)
SELECT w.id, m.text, true
FROM (VALUES
  ('talo',        'TAL-oh — imagine a TALL building. That is your Finnish house.'),
  ('auto',        'AUTO — Finnish kept the international word. Same as English!'),
  ('ihminen',     'IH-mi-nen — sounds like "I''m in" — I''m in the human race. A person.'),
  ('ruoka',       'ROO-ka — ROO sounds like "roo" in kangaroo eating FOOD from a pouch.'),
  ('vesi',        'VEH-si — VEH sounds like "wet" — wet things need WATER.'),
  ('työ',        'TYO — sounds like "two" hands doing hard WORK every day.'),
  ('koira',       'KOI-ra — a KOI fish wearing a dog collar. That is your DOG.'),
  ('kauppa',      'KAUP-pa — KAUPpa sounds like "cop" guarding the SHOP.'),
  ('puhelin',     'POO-he-lin — POOL-in-line: people queue at the PHONE booth.'),
  ('ovi',         'OH-vi — OH VEE! Someone left the DOOR open!'),
  ('ikkuna',      'IK-ku-na — ICK-una: you lick the WINDOW and it tastes icky.'),
  ('kaupunki',    'KAU-pun-ki — sounds like "cowpunk city" — a wild CITY.'),
  ('perhe',       'PER-he — PER-HEY: hey, that is my FAMILY over there!'),
  ('ystävä',      'YS-tä-vä — EAST-a-va: your best FRIEND came from the east.'),
  ('aika',        'AI-ka — AY-ka: "Ay, there is no TIME to waste!"'),
  ('päivä',       'PÄI-vä — PIE-vah: you eat pie every DAY.'),
  ('yö',          'YO — YO! It is NIGHT time, go to sleep.'),
  ('vuosi',       'VOO-si — VOO-see: you can vaguely see the whole YEAR ahead.'),
  ('kuukausi',    'KOO-kau-si — COO-COW-si: a cool cow comes once a MONTH.'),
  ('viikko',      'VIIK-ko — WEEK-oh: a WEEK goes by in a flicker.'),
  ('tunti',       'TOON-ti — TUNE-tea: a HOUR-long music tune with tea.'),
  ('mies',        'MI-es — ME-es: "Me is a MAN" — easy shortcut.'),
  ('nainen',      'NAI-nen — NYE-nen: on New Year''s Eve a WOMAN makes a wish.'),
  ('lapsi',       'LAP-si — LAP-see: a CHILD sits on your lap.'),
  ('poika',       'POI-ka — POI-ka: a POI dancer who is a BOY.'),
  ('tyttö',       'TYT-tö — TIT-oh: a tiny tot — that is the GIRL.'),
  ('äiti',        'ÄI-ti — AY-tee: "Ay tee" sounds like auntie but means MOTHER.'),
  ('isä',         'I-sä — EE-sah: EASY-ah — FATHER makes things easy.'),
  ('veli',        'VEL-i — VEIL-ee: your BROTHER lifts the veil at a wedding.'),
  ('sisar',       'SI-sar — SEE-sar: your SISTER says "see-sar!" like Caesar.'),
  ('koulu',       'KO-lu — KOH-loo: you SCHOOL yourself until you glow.'),
  ('lääkäri',     'LÄÄ-kä-ri — LAY-car-ee: the DOCTOR drives a lay-back car.'),
  ('sairaala',    'SAI-raa-la — SIGH-rah-la: you SIGH when entering the HOSPITAL.'),
  ('bussi',       'BOOS-si — BOOZY: a tipsy BUS driver — only in your imagination!'),
  ('juna',        'YOO-na — JUNE-ah: in June the TRAIN runs on schedule.'),
  ('lentokone',   'LEN-to-ko-ne — LENTO-CONE: a slow (lento) cone-shaped AEROPLANE.'),
  ('hotelli',     'HO-tel-li — HOTEL — same word in Finnish. Easy!'),
  ('ravintola',   'RA-vin-to-la — RAV-into-la: you rave into a la-la RESTAURANT.'),
  ('kahvila',     'KAH-vi-la — KAH-VEE-la: a CAFÉ where you go kah-vee (coffee) la-la.'),
  ('kirjasto',    'KIR-jas-to — CURE-jaws-toe: a LIBRARY cures your jaw and toe boredom.'),
  ('puisto',      'POOS-to — BOOST-oh: a PARK gives you an energy boost.'),
  ('meri',        'MEH-ri — MERRY: the SEA makes you merry.'),
  ('järvi',       'YÄR-vi — YARR-vee: a pirate (yarr) sails the Finnish LAKE.'),
  ('metsä',       'MET-sä — MET-sah: you MET someone in the FOREST.'),
  ('sää',         'SÄÄ — SAY: "Say, what is the WEATHER like today?"'),
  ('aurinko',     'AU-rin-ko — OR-in-go: the SUN says "or-in-go, shine or go."'),
  ('lumi',        'LOO-mi — LOOMY: everything is gloomy when SNOW covers the ground.'),
  ('sade',        'SA-de — SAH-deh: "Ah, sad-eh" — RAIN makes you a little sad.'),
  ('tuuli',       'TOO-li — TOOLEY: the WIND blows tools across Tooley Street.'),
  ('lämpö',       'LÄM-pö — LAMP-oh: a LAMP gives WARMTH and heat.'),
  ('iso',         'I-so — EE-so: ISO means BIG in photography too.'),
  ('pieni',       'PIE-ni — PEE-nee: a teeny tiny SMALL pea.'),
  ('hyvä',        'HY-vä — HEE-vah: "Heave-ah, that is GOOD work!"'),
  ('huono',       'HOO-no — HOO-no: "Hoo no, that is BAD news!"'),
  ('kaunis',      'KAU-nis — COW-nis: a BEAUTIFUL cow? In Finland, maybe!'),
  ('kylmä',       'KYL-mä — KILL-ma: the COLD tries to KILL ya.'),
  ('lämmin',      'LÄM-min — LAMM-in: a lamb in a WARM woolly coat.'),
  ('nopea',       'NO-pe-a — NO-pay-ah: "No pay? Ah, be FAST and run!"'),
  ('hidas',       'HI-das — HEE-dahs: "Heeda'' slow down" — SLOW.'),
  ('vanha',       'VAN-ha — VAN-ha: an OLD van that hardly moves.'),
  ('nuori',       'NOO-ri — NEWRY: a YOUNG person new to the city of Newry.'),
  ('uusi',        'OO-si — OO-see: "Ooh, I SEE a NEW one!"'),
  ('kallis',      'KAL-lis — CALL-is: it COSTS so much to make a CALL.'),
  ('halpa',       'HAL-pa — HAL-pa: HALf-price is CHEAP. Ha! Half price!'),
  ('pitkä',       'PIT-kä — PIT-ka: a PIT is LONG and deep.'),
  ('lyhyt',       'LY-hyt — LEW-hit: a SHORT little hit song.'),
  ('vahva',       'VAH-va — VAH-va: "VAVA vroom" — a STRONG engine.'),
  ('heikko',      'HEIK-ko — HAYK-oh: "Hay-ko that is WEAK!" said the wrestler.'),
  ('avoin',       'A-voin — AH-vo-in: "Ah, the OPEN avocado is in."'),
  ('suljettu',    'SUL-jet-tu — SOUL-jet-too: the CLOSED soul jet is too full to board.'),
  ('helppo',      'HEL-ppo — HEL-poh: "Help-oh, that was EASY after all!"'),
  ('vaikea',      'VAI-ke-a — WHY-key-ah: "WHY is this key-ah so DIFFICULT?"'),
  ('tärkeä',      'TÄR-ke-ä — TURKEY-ah: "That turkey is IMPORTANT for Thanksgiving."'),
  ('hauska',      'HAUS-ka — HOUSE-ka: "That house party is FUN!"'),
  ('surullinen',  'SU-rul-li-nen — SUE-ROOL-ee-nen: a SAD person suing while rolling.'),
  ('iloinen',     'I-loi-nen — EE-loy-nen: "Ee, a loyal hen — how HAPPY!"'),
  ('väsynyt',     'VÄ-sy-nyt — VEH-sin-it: "VEH, seen it all" — totally TIRED.'),
  ('nälkäinen',   'NÄL-käi-nen — NAL-kine-en: "NAL-kine-en" — HUNGRY like a wolf.'),
  ('janoinen',    'YA-noi-nen — YAH-noy-nen: "Yah! Noisy stomach means THIRSTY."'),
  ('terve',       'TER-ve — TER-veh: "Turvy topsy-tervy — HEALTHY upside down!"'),
  ('sairas',      'SAI-ras — SIGH-ras: you SIGH when you are ILL.'),
  ('olla',        'OL-la — OL-la: "OLLA — TO BE or not to be!"'),
  ('tulla',       'TOO-la — TOO-la: "Too-la, I need TO COME here."'),
  ('mennä',       'MEN-nä — MEN-nah: "MEN, nah — I have TO GO alone."'),
  ('saada',       'SAA-da — SAH-da: "SAH-da gift — TO GET something."'),
  ('voida',       'VOI-da — VOY-da: "Voyage — TO BE ABLE to sail."'),
  ('täytyä',      'TÄY-ty-ä — TAY-tya: "Tay tea — you MUST have it."'),
  ('antaa',       'AN-taa — ON-tah: "On-tah — TO GIVE it on a tray."'),
  ('ottaa',       'OT-taa — OT-tah: "Ot-tah — TO TAKE it and go."'),
  ('tehdä',       'TEH-dä — TEH-dah: "Teh-dah — TO DO or not to do."'),
  ('sanoa',       'SA-no-a — SAH-no-ah: "SAH, no-ah — TO SAY nothing."'),
  ('tietää',      'TIE-tää — TYEH-tah: "Tie-tah — TO KNOW how to tie a tie."'),
  ('nähdä',       'NÄH-dä — NAH-dah: "Nah-dah, TO SEE nothing here."'),
  ('kuulla',      'KOOL-la — COOL-la: "Cool-la TO HEAR cool sounds."'),
  ('lukea',       'LOO-ke-a — LUKE-ee-ah: "Luke-ee-ah — TO READ like a Jedi."'),
  ('kirjoittaa',  'KIR-yoit-taa — KEER-yoit-tah: "keer-yoit-tah — TO WRITE quickly."'),
  ('ostaa',       'OS-taa — OS-tah: "OS-tah — TO BUY the OS for your computer."'),
  ('maksaa',      'MAK-saa — MAX-ah: "MAX-ah price — TO PAY maximum."'),
  ('asua',        'A-su-a — AH-soo-ah: "Ah, sue-ah — TO LIVE and face lawsuits."'),
  ('opiskella',   'O-pis-kel-la — OH-pis-kel-la: "Oh, piccolo-la — TO STUDY music."'),
  ('rakastaa',    'RA-kas-taa — RAH-kus-tah: "RAH! Kustard — TO LOVE custard."'),
  ('haluta',      'HA-lu-ta — HAH-loo-ta: "Hah! Loota — TO WANT the loot."'),
  ('tarvita',     'TAR-vi-ta — TAR-vee-tah: "Tar-vee-tah — TO NEED tar on the road."'),
  ('löytää',      'LÖY-tää — LOY-tah: "LOYAL-tah — TO FIND a loyal friend."'),
  ('lähteä',      'LÄH-te-ä — LAH-te-ah: "Lah-te-ah — TO LEAVE like a latte to go."'),
  ('odottaa',     'O-dot-taa — OH-dot-tah: "Oh dot-tah — TO WAIT, connecting dots."'),
  ('kysyä',       'KY-sy-ä — KEE-sya: "KEY-sya — TO ASK for the key."'),
  ('vastata',     'VAS-ta-ta — VAS-tah-tah: "Vast-ah-tah — TO ANSWER vastly."'),
  ('soittaa',     'SOIT-taa — SOY-tah: "Soy-tah — TO CALL or TO PLAY music."'),
  ('katsoa',      'KAT-so-a — KAT-so-ah: "KAT-so-ah — TO WATCH the cat."'),
  ('syödä',       'SYÖ-dä — SYOH-dah: "See-oh-da — TO EAT see-food."'),
  ('juoda',       'YOO-da — YOO-da: "Yooda drinks — TO DRINK like Yoda."'),
  ('nukkua',      'NOOK-koo-a — NOOK-oo-ah: "NOOK-oo-ah — TO SLEEP in your reading nook."'),
  ('herätä',      'HE-rä-tä — HEH-rah-tah: "HEH-rah-tah — TO WAKE UP, heh!"'),
  ('kävellä',     'KÄ-vel-lä — KAH-vel-lah: "Cavell-ah — TO WALK like Edith Cavell."'),
  ('pelata',      'PE-la-ta — PEH-lah-tah: "Peh-la-ta — TO PLAY — pelota ball game."'),
  ('laulaa',      'LAU-laa — LAU-lah: "LAU-lah — TO SING la-la-la."'),
  ('minä',        'MI-nä — MEE-nah: "ME-nah — I, ME myself."'),
  ('sinä',        'SI-nä — SEE-nah: "SEE-nah — YOU, I see you."'),
  ('hän',         'HÄN — HAN: HAN Solo is HE or SHE in Finnish — gender neutral!'),
  ('me',          'ME — ME: WE, as in US, ME and you together.'),
  ('te',          'TE — TEH: YOU (plural) — "Teh, you lot!"'),
  ('he',          'HE — HEH: THEY — "Heh, they did it!"'),
  ('tämä',        'TÄ-mä — TAH-mah: "Tah-mah — THIS thing here."'),
  ('tuo',         'TOO — TOO: THAT over there — "too far away."'),
  ('se',          'SE — SEH: IT — short and simple.'),
  ('kuka',        'KOO-ka — KOO-ka: "KOO-KA-burra — WHO is that bird?"'),
  ('mikä',        'MI-kä — MEE-ka: "MEE-ka — WHAT is that? MICA mineral?"'),
  ('missä',       'MIS-sä — MIS-sah: "MISS-ah — WHERE is my miss?"'),
  ('milloin',     'MIL-loin — MIL-loyn: "MIL-loyn — WHEN will the million arrive?"'),
  ('miksi',       'MIK-si — MICK-see: "MICK-see — WHY, Mick, why?"'),
  ('miten',       'MI-ten — MEE-ten: "MEE-ten — HOW do you meet ten people?"'),
  ('yksi',        'YK-si — YEK-see: "YECK-see — ONE yucky thing."'),
  ('kaksi',       'KAK-si — KAK-see: "KAK-see — TWO cakes."'),
  ('kolme',       'KOL-me — KOL-meh: "COAL-me — THREE lumps of coal."'),
  ('neljä',       'NEL-jä — NEL-yah: "NELL-yah — FOUR Nellies."'),
  ('viisi',       'VEE-si — VEE-see: "VEE-see — FIVE V-signs."'),
  ('kuusi',       'KOO-si — KOO-see: "GOOSE-ee — SIX geese a-laying."'),
  ('seitsemän',   'SEIT-se-män — SAYT-se-man: "SEVEN-man team said SAYT-se-man."'),
  ('kahdeksan',   'KAH-dek-san — KAH-deck-san: "KAH-deck-SAND castle — EIGHT towers."'),
  ('yhdeksän',    'YH-dek-sän — YEH-deck-san: "YEAH-deck-san — NINE decks on a ship."'),
  ('kymmenen',    'KYM-me-nen — KIM-me-nen: "KIM-me-nen — TEN Kims."'),
  ('kiitos',      'KII-tos — KEE-tos: "KEY-toss — THANK YOU for tossing the key."'),
  ('ole hyvä',    'O-le HY-vä — OH-leh HEE-vah: "Oh-leh heave-ah — YOU''RE WELCOME, here you go."'),
  ('anteeksi',    'AN-teek-si — ON-teek-see: "On-teek-see antiques — EXCUSE ME."'),
  ('kyllä',       'KYL-lä — KIL-lah: "KILL-ah, YES, kill it with kindness."'),
  ('ei',          'EI — AY: "AY NO! EI means NO."'),
  ('ehkä',        'EH-kä — EH-kah: "EH-kah — MAYBE, eh, could be."'),
  ('nyt',         'NYT — NOOT: "NOOT, noot — NOW, penguin!"'),
  ('sitten',      'SIT-ten — SIT-ten: "SIT-ten — THEN sit down."'),
  ('tässä',       'TÄS-sä — TAS-sah: "TASSAH — HERE, have a tasse of coffee."'),
  ('siellä',      'SIEL-lä — SYEL-lah: "SIEL-lah — THERE, over there."'),
  ('kotona',      'KO-to-na — KOH-toh-nah: "KOH-toh-nah — AT HOME, cozy."')
) AS m(base_form, text)
JOIN words w ON w.base_form = m.base_form
ON CONFLICT DO NOTHING;
