"""The Voikko validation gate — the guarantee that no invented Finnish ships.

Phase 2 has two mechanisms doing two different jobs (see scripts/generate/README.md):

  1. The frequency list (data/finnish_frequency_lemmas.json) decides WHICH words
     the generator is allowed to use — enforced here via `enforce_allowed`.
  2. Voikko decides whether each generated form is REAL Finnish — enforced here
     by requiring every word token to morphologically analyse.

Anything Voikko cannot analyse as valid Finnish is rejected, regardless of which
model produced it. This runs in the Python backend (Linux) where Voikko loads.

IMPORTANT — register: Voikko validates STANDARD written Finnish (kirjakieli).
Spoken-Finnish (puhekieli) forms like "mä", "oon", "sun", "meil" are NOT standard
and Voikko correctly rejects them — so puhekieli must NOT be passed through this
gate. Validate the kirjakieli layer here; puhekieli is handled on its own
human-verified path (it has no CC source and no morphological validator).
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from libvoikko import Voikko

# Voikko word classes that are proper nouns / abbreviations — valid Finnish, but
# legitimately absent from a common-lemma frequency list, so exempt from the
# "is it in the allowed vocabulary" check (not from the "is it real" check).
PROPER_NOUN_CLASSES = frozenset({"etunimi", "sukunimi", "paikannimi", "nimi", "erisnimi", "lyhenne"})

# Punctuation stripped from token edges before analysis (internal - and ' kept).
_EDGE_PUNCT = ".,!?;:\"'“”‘’«»()[]{}…-–—/\\|*_~`"
_HAS_LETTER = re.compile(r"[A-Za-zÄÖÅäöåØøÜüŠšŽž]")


@dataclass
class TokenResult:
    token: str
    valid: bool                 # Voikko could analyse it as Finnish
    baseforms: list[str]
    classes: list[str]
    is_proper: bool             # only proper-noun/abbrev readings
    in_allowed: bool | None     # lemma ∈ allowed list (None if not enforced/unknown)


@dataclass
class TextResult:
    text: str
    ok: bool
    tokens: list[TokenResult] = field(default_factory=list)
    invalid_tokens: list[str] = field(default_factory=list)  # not real Finnish — the hard failure
    oov_tokens: list[str] = field(default_factory=list)      # real, but outside the allowed vocabulary


class VoikkoGate:
    """Validates that Finnish text contains only real (and optionally allowed) words."""

    def __init__(self, allowed_lemmas: set[str] | None = None, voikko: Voikko | None = None):
        self.v = voikko or Voikko("fi")
        self.allowed = {w.lower() for w in allowed_lemmas} if allowed_lemmas is not None else None

    def tokenize(self, text: str) -> list[str]:
        """Whitespace split, then strip edge punctuation. Keeps internal - and '."""
        out = []
        for raw in text.split():
            core = raw.strip(_EDGE_PUNCT)
            if core:
                out.append(core)
        return out

    def _analyze_best(self, token: str):
        """Analyse a token, tolerating sentence-initial / all-caps capitalisation."""
        seen = []
        for cand in (token, token.lower(), token.capitalize()):
            if cand in seen:
                continue
            seen.append(cand)
            analyses = self.v.analyze(cand)
            if analyses:
                return analyses
        return []

    def check_token(self, token: str) -> TokenResult | None:
        """Validate one token. Returns None for non-words (digits, bare punctuation)."""
        if not _HAS_LETTER.search(token):
            return None
        analyses = self._analyze_best(token)
        valid = len(analyses) > 0
        baseforms = [a.get("BASEFORM", "") for a in analyses]
        classes = [a.get("CLASS", "") for a in analyses]

        proper_flags = [c in PROPER_NOUN_CLASSES for c in classes if c]
        is_proper = valid and len(proper_flags) > 0 and all(proper_flags)

        in_allowed: bool | None = None
        if self.allowed is not None and valid and not is_proper:
            lemmas = {
                b.lower()
                for b, c in zip(baseforms, classes)
                if b and c not in PROPER_NOUN_CLASSES
            }
            in_allowed = any(lemma in self.allowed for lemma in lemmas)

        return TokenResult(token, valid, baseforms, classes, is_proper, in_allowed)

    def validate(self, text: str, enforce_allowed: bool = False) -> TextResult:
        """Validate a kirjakieli (standard Finnish) string. ok == nothing invented
        (and, when enforce_allowed, nothing outside the allowed vocabulary)."""
        tokens: list[TokenResult] = []
        invalid: list[str] = []
        oov: list[str] = []
        for tok in self.tokenize(text):
            r = self.check_token(tok)
            if r is None:
                continue
            tokens.append(r)
            if not r.valid:
                invalid.append(tok)
            elif enforce_allowed and r.in_allowed is False:
                oov.append(tok)
        ok = not invalid and (not enforce_allowed or not oov)
        return TextResult(text=text, ok=ok, tokens=tokens, invalid_tokens=invalid, oov_tokens=oov)


# --- Manual demonstration (no API key needed) -------------------------------
if __name__ == "__main__":
    gate = VoikkoGate(allowed_lemmas={"talo", "olla", "iso", "minä", "asua", "koira"})
    print("Gate demo — real vs invented Finnish (kirjakieli):\n")
    samples = [
        ("Talo on iso.", "real"),
        ("Minä asun isossa talossa.", "real"),
        ("Koira on pihalla.", "real (pihalla not in tiny allowed set -> OOV under enforcement)"),
        ("Talo on blarghti.", "INVENTED word 'blarghti'"),
        ("Minä kissoittelen taloa.", "INVENTED form 'kissoittelen'"),
    ]
    for text, note in samples:
        r = gate.validate(text, enforce_allowed=True)
        verdict = "ACCEPT" if r.ok else "REJECT"
        detail = []
        if r.invalid_tokens:
            detail.append(f"invented={r.invalid_tokens}")
        if r.oov_tokens:
            detail.append(f"out-of-vocabulary={r.oov_tokens}")
        print(f"  [{verdict}] {text!r:42} {'; '.join(detail)}   ({note})")
