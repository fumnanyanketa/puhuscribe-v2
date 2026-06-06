-- Add real-IPA column to words
-- ---------------------------------------------------------------------------
-- The pronunciation layer is being rebuilt from genuine IPA sourced from
-- kaikki.org / English Wiktionary (CC BY-SA) via scripts/ingest/, replacing the
-- invented "sounds-like" mnemonics. This column holds that IPA, e.g.
-- hyvä -> /ˈhyʋæ/. Populated by the generated 01_vocabulary.sql.
--
-- Forward-looking: run this BEFORE loading out/01_vocabulary.generated.sql.
-- Safe / no-op if the column already exists. Additive only — does not touch
-- auth, RLS policies, or billing.
-- ---------------------------------------------------------------------------

ALTER TABLE words ADD COLUMN IF NOT EXISTS ipa TEXT;

COMMENT ON COLUMN words.ipa IS
  'IPA pronunciation from kaikki.org / English Wiktionary (CC BY-SA). NULL until ingested.';
