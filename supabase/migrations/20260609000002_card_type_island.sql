-- Add the 'island_recall' card type (English prompt -> produce your own Finnish
-- sentence). Kept in its own migration: Postgres requires a new enum value to be
-- committed before it can be used, so run this BEFORE 20260609000003.
ALTER TYPE card_type ADD VALUE IF NOT EXISTS 'island_recall';
