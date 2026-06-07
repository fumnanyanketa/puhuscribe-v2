-- Grant the authenticated role the minimum privileges needed on per-user tables.
-- RLS policies in 20260603000001_initial_schema.sql handle row-level isolation
-- (each user can only see/modify their own rows). Without these GRANTs the
-- policy evaluation step is never reached and all queries fail with
-- "permission denied for table ...".

GRANT SELECT, INSERT, UPDATE ON TABLE public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.cards TO authenticated;
GRANT INSERT, SELECT ON TABLE public.review_logs TO authenticated;

-- Unique constraint so we can upsert cards without creating duplicates
-- when seedInitialCards() is called more than once. Guarded so the whole
-- migration is safe to re-run (ADD CONSTRAINT has no IF NOT EXISTS form).
DO $$
BEGIN
  ALTER TABLE cards
    ADD CONSTRAINT cards_user_sentence_type_unique
    UNIQUE (user_id, sentence_id, card_type);
EXCEPTION
  WHEN duplicate_table THEN NULL;   -- the backing unique index already exists
  WHEN duplicate_object THEN NULL;  -- the constraint already exists
END $$;
