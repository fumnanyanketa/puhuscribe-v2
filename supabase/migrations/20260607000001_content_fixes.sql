-- Content fixes — handoff §1 (base_form spelling) + §3 (translations)
-- ---------------------------------------------------------------------------
-- These are UNAMBIGUOUS, factual corrections — NOT pronunciation guesses. The
-- systematic pronunciation rewrite (§4) is deliberately deferred until real IPA
-- from kaikki.org is ingested via scripts/ingest/ (re-deriving phonology by hand
-- would re-introduce exactly the AI-guessed Finnish the owner rejected).
--
-- The live DB seeds use ON CONFLICT DO NOTHING, so re-running the seed files
-- does NOT update existing rows. Run this once in the Supabase SQL editor.
-- Idempotent: safe to re-run (UPDATEs converge; base_form changes are guarded).
-- ---------------------------------------------------------------------------

BEGIN;

-- §1 — base_form spelling typos (these teach the WRONG Finnish spelling).
-- Guarded with NOT EXISTS so each is a no-op once corrected, and never collides
-- with an already-correct row (base_form is UNIQUE).
UPDATE words SET base_form = 'hedelmä'
  WHERE base_form = 'hedelma'
    AND NOT EXISTS (SELECT 1 FROM words w2 WHERE w2.base_form = 'hedelmä');

UPDATE words SET base_form = 'hyvä'
  WHERE base_form = 'hyva'
    AND NOT EXISTS (SELECT 1 FROM words w2 WHERE w2.base_form = 'hyvä');

UPDATE words SET base_form = 'tummansininen'
  WHERE base_form = 'tummansiniinen'
    AND NOT EXISTS (SELECT 1 FROM words w2 WHERE w2.base_form = 'tummansininen');

-- §3 — translation corrections.
-- terve: primary everyday meaning is the greeting (the "healthy" sense is a
--        separate, lower-frequency entry).
UPDATE words SET translation_en = 'hello'               WHERE base_form = 'terve';
-- minä: just "I" — there is no formal/informal split on the first person.
UPDATE words SET translation_en = 'I / me'              WHERE base_form = 'minä';
-- voida: one canonical gloss (the "feel" sense is "voida hyvin/huonosti").
UPDATE words SET translation_en = 'to be able to / can' WHERE base_form = 'voida';

COMMIT;

-- NOTE for the owner (not auto-applied — judgement calls):
--   • 'koiran' ("of the dog (genitive)") teaches an inflected case form as a
--     standalone vocab item — consider removing or moving to a grammar lesson.
--   • The 12 missing high-frequency words (kyllä, tämä, tuo, se, ehkä, …) and
--     their mnemonics are intentionally NOT added here: mnemonics are deferred
--     (handoff §0) and the full lexicon will be regenerated from Leipzig+kaikki
--     via scripts/ingest/ with real IPA, rather than patched word-by-word.
