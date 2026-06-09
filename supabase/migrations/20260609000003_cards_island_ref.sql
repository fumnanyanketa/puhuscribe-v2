-- Let the existing FSRS scheduler own personal island sentences too, so the
-- learner's own sentences get spaced repetition exactly like words and seed
-- sentences. A card is still tied to exactly one content item — now one of
-- word / sentence / island sentence.

ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS island_sentence_id UUID
    REFERENCES user_island_sentences(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS cards_island_sentence_idx ON cards (island_sentence_id);

ALTER TABLE cards DROP CONSTRAINT IF EXISTS card_has_one_item;
ALTER TABLE cards ADD CONSTRAINT card_has_one_item CHECK (
  (word_id            IS NOT NULL)::INT
  + (sentence_id        IS NOT NULL)::INT
  + (island_sentence_id IS NOT NULL)::INT = 1
);
