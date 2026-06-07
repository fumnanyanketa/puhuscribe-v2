"""Tests for the validated-content -> Supabase seed emitter (to_seed_sql.emit)."""
import to_seed_sql


ITEMS = [
    {"kirjakieli": "Talo on iso.", "puhekieli": "Talo on iso.",
     "translation_en": "The house is big.", "_topic_slug": "home", "_level": "A1"},
    {"kirjakieli": "Minulla on koira.", "puhekieli": "Mul on koira.",
     "translation_en": "I have a dog.", "_topic_slug": "family", "_level": "A2"},
    {"kirjakieli": "Se maksaa 5 euroa.", "puhekieli": "Se maksaa viis euroo.",
     "translation_en": "It costs 5 euros.", "_topic_slug": None, "_level": "BAD"},
]


def test_emits_validated_kirjakieli_with_null_puhekieli():
    sql, _ = to_seed_sql.emit(ITEMS)
    assert "INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES" in sql
    # kirjakieli shipped, puhekieli NULL, topic via subselect, level honoured
    assert "('Talo on iso.', NULL, 'The house is big.', 'A1', (SELECT id FROM topics WHERE slug = 'home'))" in sql
    assert "ON CONFLICT DO NOTHING;" in sql
    # No spoken form ever appears in the shipping SQL.
    assert "Mul on koira" not in sql


def test_invalid_level_defaults_and_null_topic():
    sql, _ = to_seed_sql.emit(ITEMS)
    # _level "BAD" is not a valid CEFR enum -> defaults to A2; missing slug -> NULL topic
    assert "('Se maksaa 5 euroa.', NULL, 'It costs 5 euros.', 'A2', NULL)" in sql


def test_quotes_escaped():
    sql, _ = to_seed_sql.emit([
        {"kirjakieli": "En tiedä.", "puhekieli": "En tiiä.",
         "translation_en": "I don't know.", "_topic_slug": "greetings", "_level": "A1"},
    ])
    assert "'I don''t know.'" in sql  # single quote doubled


def test_review_tsv_carries_unverified_puhekieli():
    _, review = to_seed_sql.emit(ITEMS)
    assert "UNVERIFIED" in review
    assert "Talo on iso.\tTalo on iso.\thome\tA1" in review
    assert "Mul on koira" in review  # the generated puhekieli lives ONLY in the review file
