"""Generate a full validated content set across all YKI topics, then emit seed SQL.

This is the "run generation live" driver. For each topic (and each requested CEFR
level) it runs the grounded generate-then-validate loop, tags every accepted item
with its topic + level, aggregates the rejection stats, writes the combined
validated JSON, and produces the loadable seed SQL via to_seed_sql.

Live (needs ANTHROPIC_API_KEY):
    python scripts/generate/run_batch.py --per-topic 8 --levels A1 A2
Offline smoke (no key — uses the stub generator to exercise the whole path):
    python scripts/generate/run_batch.py --demo --per-topic 2 --levels A1
"""
from __future__ import annotations

import argparse
import json
import os

import to_seed_sql
from allowed_vocab import load_allowed_lemmas
from generate import GenConfig, _stub_generate, call_claude, generate_validated
from topic_plan import TOPICS
from voikko_gate import VoikkoGate

# Frequency ceiling per level — easier levels draw from more common words.
LEVEL_MAX_RANK = {"A1": 800, "A2": 1500, "B1": 3000, "B2": 6000}


def main():
    ap = argparse.ArgumentParser(description="Generate a validated Finnish content set across all YKI topics.")
    ap.add_argument("--per-topic", type=int, default=8, help="validated items per (topic, level)")
    ap.add_argument("--levels", nargs="+", default=["A1", "A2"])
    ap.add_argument("--model", default="claude-sonnet-4-6")
    ap.add_argument("--topics", nargs="*", default=None, help="limit to these slugs (default: all 25)")
    ap.add_argument("--demo", action="store_true", help="offline stub generator (no API key)")
    args = ap.parse_args()

    use_stub = args.demo or not os.getenv("ANTHROPIC_API_KEY")
    if use_stub and not args.demo:
        print("ANTHROPIC_API_KEY not set — running offline stub to exercise the pipeline.\n")

    client = None
    if not use_stub:
        import anthropic
        client = anthropic.Anthropic()

    gate = VoikkoGate(allowed_lemmas=set(load_allowed_lemmas()))
    plan = [(s, n) for (s, n) in TOPICS if not args.topics or s in args.topics]

    all_items: list[dict] = []
    agg = {"candidates": 0, "accepted": 0, "rejected_invented": 0, "rejected_oov": 0,
           "tokens_total": 0, "tokens_invented": 0, "tokens_oov": 0}
    invented: set[str] = set()

    for slug, name in plan:
        for level in args.levels:
            cfg = GenConfig(
                model=args.model, n=args.per_topic, topic=name, topic_slug=slug,
                level=level, max_rank=LEVEL_MAX_RANK.get(level, 1500),
            )
            gen_fn = _stub_generate if use_stub else (lambda p, cf=cfg: call_claude(client, cf, p))
            items, stats = generate_validated(cfg, gate, gen_fn)
            all_items.extend(items)
            for k in agg:
                agg[k] += getattr(stats, k)
            invented.update(stats.invented_examples)
            print(f"  {slug:18} {level}: accepted {stats.accepted}/{args.per_topic} "
                  f"(invented {stats.rejected_invented}, oov {stats.rejected_oov})")

    to_seed_sql.OUT_DIR.mkdir(parents=True, exist_ok=True)
    (to_seed_sql.OUT_DIR / "generated_content.json").write_text(
        json.dumps({"stats": agg, "items": all_items}, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    sql, review = to_seed_sql.emit(all_items)
    (to_seed_sql.OUT_DIR / "generated_sentences.sql").write_text(sql, encoding="utf-8")
    (to_seed_sql.OUT_DIR / "generated_puhekieli_REVIEW.tsv").write_text(review, encoding="utf-8")

    tok = max(agg["tokens_total"], 1)
    print(f"\nTotal validated items: {len(all_items)}")
    print(f"Candidates: {agg['candidates']} | invented rejected: {agg['rejected_invented']} | "
          f"oov rejected: {agg['rejected_oov']}")
    print(f"Token invented rate: {round(agg['tokens_invented']/tok, 4)} | "
          f"token oov rate: {round(agg['tokens_oov']/tok, 4)}")
    if invented:
        print(f"Invented forms caught (never shipped): {sorted(invented)[:20]}")
    print(f"\nWrote out/generated_content.json, out/generated_sentences.sql, out/generated_puhekieli_REVIEW.tsv")
    print("Next: review the SQL, then run it once in the Supabase SQL editor.")


if __name__ == "__main__":
    main()
