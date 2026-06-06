#!/usr/bin/env python3
"""Build a clean 10,000-word Finnish *lemma* frequency list.

PURPOSE
    This list is the "allowed vocabulary" that grounds the content generator in
    Phase 2 (scripts/generate/). It exists so the generator can only build
    content from real, common Finnish words — and so a Voikko gate can reject
    any invented inflected form. One-time data-prep: generated once, committed,
    read by the app at build/seed time. Do NOT regenerate at runtime.

PIPELINE
    1. Pull raw Finnish word *forms* + frequencies from `wordfreq` (large list:
       a blend of OpenSubtitles, SUBTLEX, Wikipedia, news and Twitter/X — so it
       covers both spoken and written registers).
    2. Finnish is heavily inflected, so those are surface forms, not base words.
       For each form, ask Voikko for the BASEFORM (lemma) and sum frequencies by
       lemma (talo, talon, talossa, taloja -> "talo").
    3. Keep only tokens Voikko confirms as valid Finnish. Drop proper nouns
       (Voikko name word classes), abbreviations, single letters, numbers,
       punctuation and foreign words (anything Voikko cannot analyse).
    4. Sort by aggregated frequency (descending) and take the top 10,000 lemmas.
    5. Write a structured JSON file the app loads (data/finnish_frequency_lemmas.json).

SOURCES / ATTRIBUTION
    - Frequency data: `wordfreq` (Robyn Speer et al.), MIT-licensed code; the
      underlying data is freely available and blends several corpora. Per
      wordfreq's request, credit the SUBTLEX authors (Brysbaert, New, Keuleers
      et al.) whose subtitle frequency data is part of the blend.
    - Lemmatisation + validation: Voikko (libvoikko + voikko-fi), free/open
      Finnish morphology (GPL/MPL). https://voikko.puimula.org/

ENVIRONMENT (Linux; Voikko must load — no pyvoikko fallback)
    apt-get install -y libvoikko1 voikko-fi
    pip install libvoikko wordfreq
    python3 scripts/build_frequency_list.py

Run `python3 scripts/build_frequency_list.py --help` for options.
"""
from __future__ import annotations

import argparse
import datetime as _dt
import json
import math
import re
import sys
from collections import defaultdict
from pathlib import Path

try:
    from libvoikko import Voikko
except Exception as exc:  # pragma: no cover - environment guard
    sys.exit(
        f"FATAL: could not import libvoikko ({exc}).\n"
        "Install it with: apt-get install -y libvoikko1 voikko-fi && pip install libvoikko\n"
        "Per project decision, do NOT fall back to pyvoikko — stop and report instead."
    )

try:
    import wordfreq
except Exception as exc:  # pragma: no cover - environment guard
    sys.exit(f"FATAL: could not import wordfreq ({exc}). Install with: pip install wordfreq")


# Only pure-alphabetic Finnish tokens (lowercased); allow internal hyphens for
# compounds. Everything with a digit, apostrophe, space or other punctuation is
# rejected up front (handles "numbers, punctuation, single letters").
TOKEN_RE = re.compile(r"^[a-zäöåšž]+(-[a-zäöåšž]+)*$")

# Voikko word classes (CLASS) that are NOT learnable common vocabulary.
EXCLUDED_CLASSES = {
    "etunimi",     # first name
    "sukunimi",    # surname
    "paikannimi",  # place name
    "nimi",        # generic name
    "erisnimi",    # proper noun
    "lyhenne",     # abbreviation
}

# Voikko CLASS -> compact English part of speech.
CLASS_TO_POS = {
    "nimisana": "noun",
    "teonsana": "verb",
    "laatusana": "adjective",
    "nimisana_laatusana": "adjective",
    "seikkasana": "adverb",
    "asemosana": "pronoun",
    "lukusana": "numeral",
    "sidesana": "conjunction",
    "suhdesana": "adposition",
    "huudahdussana": "interjection",
    "etuliite": "prefix",
    "kieltosana": "negation",
}


def pick_analysis(analyses):
    """Choose the best Voikko analysis for a surface form.

    Prefer the first analysis whose word class is real common vocabulary
    (not a proper noun / abbreviation). Returns (baseform, pos) or None if the
    form has no usable common-word reading.
    """
    for a in analyses:
        cls = a.get("CLASS")
        if cls in EXCLUDED_CLASSES:
            continue
        base = (a.get("BASEFORM") or "").strip()
        if not base:
            continue
        return base, CLASS_TO_POS.get(cls, "other")
    return None


def build(limit: int, max_forms: int | None):
    v = Voikko("fi")

    wordlist = "large"
    try:
        freq = wordfreq.get_frequency_dict("fi", wordlist=wordlist)
    except LookupError:
        wordlist = "small"
        freq = wordfreq.get_frequency_dict("fi", wordlist=wordlist)

    # Most-frequent first so the POS we record for a lemma comes from its most
    # representative surface form.
    forms = sorted(freq.items(), key=lambda kv: kv[1], reverse=True)
    if max_forms:
        forms = forms[:max_forms]

    agg_freq: dict[str, float] = defaultdict(float)
    agg_count: dict[str, int] = defaultdict(int)
    lemma_pos: dict[str, str] = {}

    rejected = defaultdict(int)
    processed = 0

    for form, f in forms:
        processed += 1
        if not TOKEN_RE.match(form) or len(form) < 2:
            rejected["non_alpha_or_single_letter"] += 1
            continue

        analyses = v.analyze(form)
        if not analyses:
            rejected["no_analysis_foreign_or_invalid"] += 1
            continue

        picked = pick_analysis(analyses)
        if picked is None:
            rejected["proper_noun_or_abbrev_only"] += 1
            continue

        base, pos = picked
        lemma = base.lower()

        # Final lemma-level guard: real, alphabetic, multi-letter, spellable, and
        # not a residual capitalised proper noun.
        if base[:1].isupper() or not TOKEN_RE.match(lemma) or len(lemma) < 2 or not v.spell(lemma):
            rejected["lemma_filtered"] += 1
            continue

        if lemma not in lemma_pos:
            lemma_pos[lemma] = pos  # first (most frequent) contributor wins
        agg_freq[lemma] += f
        agg_count[lemma] += 1

    ranked = sorted(agg_freq.items(), key=lambda kv: kv[1], reverse=True)
    top = ranked[:limit]

    lemmas = []
    for rank, (lemma, total) in enumerate(top, start=1):
        lemmas.append(
            {
                "rank": rank,
                "lemma": lemma,
                "frequency": float(f"{total:.12g}"),
                "zipf": round(math.log10(total) + 9, 2) if total > 0 else None,
                "pos": lemma_pos.get(lemma, "other"),
                "forms": agg_count[lemma],
            }
        )

    meta = {
        "description": "Top Finnish lemmas by aggregated frequency. Allowed vocabulary "
        "for the Phase 2 content generator; every form validated by Voikko.",
        "generated": _dt.date.today().isoformat(),
        "frequency_source": f"wordfreq '{wordlist}' Finnish (blend incl. OpenSubtitles, "
        "SUBTLEX, Wikipedia, news, Twitter/X)",
        "lemmatiser_validator": "Voikko (libvoikko + voikko-fi)",
        "attribution": "Frequency data via wordfreq (MIT); credit SUBTLEX authors "
        "(Brysbaert, New, Keuleers et al.), data freely available. "
        "Lemmatisation/validation by Voikko (voikko.puimula.org).",
        "raw_forms_processed": processed,
        "rejected": dict(rejected),
        "distinct_lemmas": len(agg_freq),
        "count": len(lemmas),
    }

    return meta, lemmas, ranked


def main():
    ap = argparse.ArgumentParser(description="Build a clean Finnish lemma frequency list (Voikko + wordfreq).")
    ap.add_argument("--limit", type=int, default=10000, help="number of top lemmas to keep (default 10000)")
    ap.add_argument("--max-forms", type=int, default=None, help="cap raw forms processed (debug; default all)")
    ap.add_argument(
        "--out",
        default=str(Path(__file__).resolve().parent.parent / "data" / "finnish_frequency_lemmas.json"),
        help="output JSON path",
    )
    args = ap.parse_args()

    meta, lemmas, ranked = build(args.limit, args.max_forms)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as fh:
        json.dump({"meta": meta, "lemmas": lemmas}, fh, ensure_ascii=False, indent=2)
        fh.write("\n")

    # --- Report -------------------------------------------------------------
    print("Top 30 lemmas (confirm these are real, common Finnish words):")
    for e in lemmas[:30]:
        print(f"  #{e['rank']:>3}  {e['lemma']:<16} zipf={e['zipf']:<5} {e['pos']:<11} (from {e['forms']} forms)")
    print()
    total_rejected = sum(meta["rejected"].values())
    print(f"raw forms processed : {meta['raw_forms_processed']:,}")
    print(f"rejected (total)    : {total_rejected:,}")
    for reason, n in sorted(meta["rejected"].items(), key=lambda kv: -kv[1]):
        print(f"    - {reason:<32} {n:,}")
    print(f"distinct lemmas kept: {meta['distinct_lemmas']:,}")
    print(f"final count written : {meta['count']:,}  ->  {out_path}")


if __name__ == "__main__":
    main()
