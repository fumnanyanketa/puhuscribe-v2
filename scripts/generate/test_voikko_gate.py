"""Tests for the Voikko validation gate and the generate-then-validate loop.

These prove the Phase 2 guarantee: invented Finnish is rejected and never reaches
the accepted output, and the loop logs how often the generator invents words.

Run: .venv/bin/pytest scripts/generate/
(requires libvoikko1 + voikko-fi installed; see scripts/build_frequency_list.py header)
"""
import pytest

import allowed_vocab
from generate import GenConfig, generate_validated
from voikko_gate import VoikkoGate

ALLOWED = {
    "talo", "olla", "iso", "minä", "asua", "koira", "syödä", "ruoka",
    "lapsi", "nukkua", "hyvin", "hyvä", "vanha", "ja", "me",
}


@pytest.fixture(scope="module")
def gate():
    return VoikkoGate(allowed_lemmas=ALLOWED)


def test_accepts_real_finnish(gate):
    assert gate.validate("Talo on iso.").ok
    assert gate.validate("Minä asun isossa talossa.", enforce_allowed=False).ok


def test_rejects_invented_word(gate):
    r = gate.validate("Talo on blarghti.")
    assert not r.ok
    assert "blarghti" in r.invalid_tokens


def test_rejects_invented_inflection(gate):
    r = gate.validate("Minä kissoittelen koiraa.")
    assert not r.ok
    assert "kissoittelen" in r.invalid_tokens


def test_puhekieli_forms_rejected_by_kirjakieli_gate(gate):
    # 'oon' (spoken 'olen') is valid spoken Finnish but NOT standard — Voikko
    # rejects it. This is exactly why puhekieli must not be passed through this
    # gate; only the kirjakieli layer is validated here.
    assert gate.check_token("oon").valid is False
    assert not gate.validate("Mä oon väsyny").ok


def test_proper_noun_valid_and_exempt(gate):
    r = gate.validate("Minä asun Helsingissä.", enforce_allowed=True)
    assert "Helsingissä" not in r.invalid_tokens  # real Finnish (a place name)
    assert "Helsingissä" not in r.oov_tokens       # exempt from the allowed-list check


def test_enforce_allowed_flags_oov_but_realness_mode_passes(gate):
    text = "Koira on pihalla."  # 'pihalla' is real Finnish but not in ALLOWED
    assert gate.validate(text, enforce_allowed=True).oov_tokens == ["pihalla"]
    assert gate.validate(text, enforce_allowed=False).ok


def test_generate_loop_drops_invented_and_logs_rate(gate):
    candidates = [
        {"kirjakieli": "Talo on iso.", "puhekieli": "Talo on iso.", "translation_en": "x"},
        {"kirjakieli": "Minä kissoittelen.", "puhekieli": "x", "translation_en": "x"},  # invented
        {"kirjakieli": "Lapsi nukkuu hyvin.", "puhekieli": "x", "translation_en": "x"},
    ]
    cfg = GenConfig(n=2, max_retries=0, enforce_allowed=False)
    items, stats = generate_validated(cfg, gate, lambda _prompt: candidates)

    assert stats.accepted == 2
    assert all("kissoittelen" not in i["kirjakieli"] for i in items)  # invented never accepted
    assert stats.rejected_invented >= 1
    assert stats.rates()["candidate_invented_rate"] > 0


def test_allowed_vocab_loads():
    lemmas = allowed_vocab.load_allowed_lemmas()
    assert {"olla", "talo", "hyvä"} <= lemmas
    assert len(lemmas) == 10000


def test_sample_lemmas_respects_filters():
    top5 = allowed_vocab.sample_lemmas(5, max_rank=50)
    assert len(top5) == 5
    verbs = allowed_vocab.sample_lemmas(3, pos="verb", max_rank=2000)
    assert len(verbs) == 3
