-- Cross-device learning progress: onboarding-seen + Day One Sprint position.
-- Stored as a single jsonb blob on the user's own row, e.g.
--   { "onboarded": true, "sprint": { "size": 150, "idx": 47, "completed": false } }
-- The users_own_row RLS policy (initial_schema) and the table-level GRANT on
-- public.users (20260606000002) already cover this column, so no extra policy
-- or grant is needed. Safe to re-run.
ALTER TABLE users ADD COLUMN IF NOT EXISTS progress jsonb NOT NULL DEFAULT '{}'::jsonb;
