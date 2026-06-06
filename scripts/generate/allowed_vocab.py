"""Load the committed Finnish lemma frequency list (Phase 1 output).

This is the "allowed vocabulary" that grounds the generator: the model may only
build content from these real, common lemmas, and the Voikko gate enforces it.
The file is read once at generation time — never regenerated at runtime.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

DEFAULT_PATH = Path(__file__).resolve().parents[2] / "data" / "finnish_frequency_lemmas.json"


def load_entries(path: Path | str = DEFAULT_PATH) -> list[dict]:
    """Return the full list of {rank, lemma, frequency, zipf, pos, forms} entries."""
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    return data["lemmas"]


@lru_cache(maxsize=4)
def load_allowed_lemmas(path: Path | str = DEFAULT_PATH) -> frozenset[str]:
    """Return the set of allowed lemmas (lowercased) for fast membership checks."""
    return frozenset(e["lemma"].lower() for e in load_entries(path))


def sample_lemmas(
    n: int,
    *,
    max_rank: int | None = None,
    pos: str | None = None,
    path: Path | str = DEFAULT_PATH,
) -> list[str]:
    """Pick the top `n` lemmas to ground a generation request.

    Constrain to the most common words with `max_rank` (e.g. 1500 for beginner
    content) and/or to a part of speech with `pos` ("noun", "verb", ...). Returns
    lemmas in frequency order so the most useful words come first.
    """
    out = []
    for e in load_entries(path):
        if max_rank is not None and e["rank"] > max_rank:
            break
        if pos is not None and e["pos"] != pos:
            continue
        out.append(e["lemma"])
        if len(out) >= n:
            break
    return out
