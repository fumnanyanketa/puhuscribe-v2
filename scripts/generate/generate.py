"""Grounded generate-then-validate loop for Finnish dual-register content.

The point of Phase 2: stop the generator from inventing Finnish words.

Two mechanisms (see README.md):
  • Grounding — the prompt constrains the model to the committed frequency list
    (real, common lemmas), at low variance, with correct dual-register examples,
    and an explicit "never invent forms" instruction.
  • Voikko gate — EVERY generated kirjakieli word is validated with Voikko; any
    token that is not real Finnish (or, optionally, not in the allowed list) is
    rejected, and the item is regenerated or dropped. This guarantees no invented
    form reaches a learner, regardless of which model produced it.

The rejection rate is logged so you can see how often the model invents words.

Model note: Opus 4.8 (the default, most-capable model) removed the `temperature`
parameter, so "lower the temperature" is honoured via lower `effort` + a
determinism instruction + structured outputs. `temperature` is sent only on
models that still accept it (e.g. Sonnet 4.6) — see `_supports_temperature`.

Run live (needs ANTHROPIC_API_KEY):
    python scripts/generate/generate.py --n 20 --topic "daily life" --level A2
Offline demonstration of the gate + loop (no key, uses a stub generator):
    python scripts/generate/generate.py --demo
"""
from __future__ import annotations

import argparse
import json
import os
from dataclasses import dataclass, field
from pathlib import Path

from allowed_vocab import load_allowed_lemmas, sample_lemmas
from voikko_gate import VoikkoGate

OUT_DIR = Path(__file__).resolve().parent / "out"

SYSTEM_PROMPT = """You generate Finnish language-learning content for adult immigrants \
studying for the YKI exam (CEFR A1–B2). You write natural, correct Finnish.

HARD RULES:
1. Use ONLY words whose dictionary form (lemma) appears in the ALLOWED VOCABULARY \
list given in the user message. Do not introduce lemmas outside that list (proper \
names and numbers are allowed).
2. NEVER invent words or inflected forms. Every Finnish word must be a real, \
standard, correctly-inflected form that a Finnish dictionary/morphology checker \
would accept. If you are unsure a form is real, choose a simpler word from the list.
3. For each item produce a dual-register pair:
   - kirjakieli: standard written Finnish (this is validated by a morphology checker).
   - puhekieli: natural colloquial spoken Finnish (e.g. minä→mä, sinä→sä, olen→oon).
4. Keep sentences short and natural for the requested CEFR level, and give an \
accurate English translation.
Return only the requested items."""

# A few correct dual-register examples (universally standard) to anchor the model.
FEWSHOT_EXAMPLES = [
    {"kirjakieli": "Minä olen väsynyt.", "puhekieli": "Mä oon väsyny.", "translation_en": "I am tired."},
    {"kirjakieli": "Mitä sinä teet?", "puhekieli": "Mitä sä teet?", "translation_en": "What are you doing?"},
    {"kirjakieli": "Minulla on nälkä.", "puhekieli": "Mul on nälkä.", "translation_en": "I am hungry."},
]

# Structured-output schema: a JSON object with an "items" array.
OUTPUT_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "kirjakieli": {"type": "string"},
                    "puhekieli": {"type": "string"},
                    "translation_en": {"type": "string"},
                },
                "required": ["kirjakieli", "puhekieli", "translation_en"],
            },
        }
    },
    "required": ["items"],
}


@dataclass
class GenConfig:
    model: str = "claude-sonnet-4-6"
    temperature: float | None = 0.2  # applied only on models that accept it
    effort: str = "low"              # lower variance / cost for content generation
    max_tokens: int = 4096
    n: int = 10
    topic: str = "everyday life"
    topic_slug: str | None = None
    level: str = "A2"
    max_rank: int = 1500             # ground in the most common ~1500 lemmas
    vocab_size: int = 200            # how many allowed words to offer the model
    max_retries: int = 3
    enforce_allowed: bool = True


@dataclass
class GenStats:
    candidates: int = 0
    accepted: int = 0
    rejected_invented: int = 0       # had a word Voikko couldn't analyse
    rejected_oov: int = 0            # only out-of-allowed-vocabulary words
    tokens_total: int = 0
    tokens_invented: int = 0
    tokens_oov: int = 0
    rounds: int = 0
    invented_examples: list[str] = field(default_factory=list)

    def rates(self) -> dict:
        cand = max(self.candidates, 1)
        tok = max(self.tokens_total, 1)
        return {
            "candidate_invented_rate": round(self.rejected_invented / cand, 4),
            "candidate_oov_rate": round(self.rejected_oov / cand, 4),
            "token_invented_rate": round(self.tokens_invented / tok, 4),
            "token_oov_rate": round(self.tokens_oov / tok, 4),
        }


def _supports_temperature(model: str) -> bool:
    # Opus 4.7 and 4.8 removed temperature/top_p/top_k (400 if sent).
    return not (model.startswith("claude-opus-4-8") or model.startswith("claude-opus-4-7"))


def _supports_effort(model: str) -> bool:
    # effort is supported on Opus 4.5+ and Sonnet 4.6; errors on Sonnet 4.5 / Haiku 4.5.
    return model.startswith("claude-opus-4") or model.startswith("claude-sonnet-4-6")


def build_user_prompt(allowed_words: list[str], cfg: GenConfig, avoid: set[str] | None = None) -> str:
    examples = "\n".join(
        f'  - kirjakieli: "{e["kirjakieli"]}" | puhekieli: "{e["puhekieli"]}" | en: "{e["translation_en"]}"'
        for e in FEWSHOT_EXAMPLES
    )
    avoid_note = ""
    if avoid:
        avoid_note = (
            "\n\nThe previous attempt used these NON-WORDS or disallowed words — do "
            f"NOT use them or any inflection of them: {', '.join(sorted(avoid))}."
        )
    return (
        f"Topic: {cfg.topic}\nCEFR level: {cfg.level}\n"
        f"Generate {cfg.n} dual-register sentence pairs.\n\n"
        f"ALLOWED VOCABULARY (use only these lemmas, in any correct inflection):\n"
        f"{', '.join(allowed_words)}\n\n"
        f"Correct dual-register examples:\n{examples}{avoid_note}"
    )


def call_claude(client, cfg: GenConfig, user_prompt: str) -> list[dict]:
    """Real generation via the Anthropic Messages API (structured outputs)."""
    output_config: dict = {"format": {"type": "json_schema", "schema": OUTPUT_SCHEMA}}
    if _supports_effort(cfg.model):
        output_config["effort"] = cfg.effort
    kwargs = dict(
        model=cfg.model,
        max_tokens=cfg.max_tokens,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
        output_config=output_config,
    )
    if cfg.temperature is not None and _supports_temperature(cfg.model):
        kwargs["temperature"] = cfg.temperature  # honour "lower the temperature" where the model allows it
    resp = client.messages.create(**kwargs)
    text = "".join(b.text for b in resp.content if getattr(b, "type", None) == "text")
    return json.loads(text).get("items", [])


def generate_validated(cfg: GenConfig, gate: VoikkoGate, generate_fn) -> tuple[list[dict], GenStats]:
    """Generate, validate every kirjakieli form with Voikko, regenerate/drop failures.

    `generate_fn(user_prompt) -> list[candidate dict]` is injectable so the loop and
    gate are testable offline without the Anthropic API.
    """
    allowed = sample_lemmas(cfg.vocab_size, max_rank=cfg.max_rank)
    accepted: list[dict] = []
    stats = GenStats()
    avoid: set[str] = set()

    while len(accepted) < cfg.n and stats.rounds <= cfg.max_retries:
        stats.rounds += 1
        prompt = build_user_prompt(allowed, cfg, avoid=avoid or None)
        candidates = generate_fn(prompt)
        for c in candidates:
            stats.candidates += 1
            res = gate.validate(c.get("kirjakieli", ""), enforce_allowed=cfg.enforce_allowed)
            stats.tokens_total += len(res.tokens)
            stats.tokens_invented += len(res.invalid_tokens)
            stats.tokens_oov += len(res.oov_tokens)
            if res.ok:
                c["_validated"] = True
                c["_topic_slug"] = cfg.topic_slug
                c["_level"] = cfg.level
                accepted.append(c)
                stats.accepted += 1
                if len(accepted) >= cfg.n:
                    break
            elif res.invalid_tokens:
                stats.rejected_invented += 1
                avoid.update(res.invalid_tokens)
                stats.invented_examples.extend(res.invalid_tokens)
            else:
                stats.rejected_oov += 1
                avoid.update(res.oov_tokens)
        if not candidates:
            break  # generator produced nothing; stop rather than spin
    return accepted[: cfg.n], stats


# --- Offline stub generator (demonstrates the gate without an API key) -------
def _stub_generate(_user_prompt: str) -> list[dict]:
    """Mimics a model that mostly behaves but occasionally invents a word/form."""
    return [
        {"kirjakieli": "Minä asun Helsingissä.", "puhekieli": "Mä asun Helsingissä.", "translation_en": "I live in Helsinki."},
        {"kirjakieli": "Talo on iso ja vanha.", "puhekieli": "Talo on iso ja vanha.", "translation_en": "The house is big and old."},
        # invented inflection (not real Finnish) — must be rejected:
        {"kirjakieli": "Minä kissoittelen koiraa.", "puhekieli": "Mä kissoittelen koiraa.", "translation_en": "(nonsense verb)"},
        {"kirjakieli": "Me syömme ruokaa.", "puhekieli": "Me syödään ruokaa.", "translation_en": "We eat food."},
        # invented word — must be rejected:
        {"kirjakieli": "Sää on blarghti tänään.", "puhekieli": "Sää on blarghti tänään.", "translation_en": "(nonsense word)"},
        {"kirjakieli": "Lapsi nukkuu hyvin.", "puhekieli": "Lapsi nukkuu hyvin.", "translation_en": "The child sleeps well."},
    ]


def main():
    ap = argparse.ArgumentParser(description="Grounded generate-then-validate Finnish content (Voikko-gated).")
    ap.add_argument("--n", type=int, default=10)
    ap.add_argument("--topic", default="everyday life")
    ap.add_argument("--topic-slug", default=None, help="topics.slug for loading into Supabase")
    ap.add_argument("--level", default="A2")
    ap.add_argument("--model", default="claude-sonnet-4-6")
    ap.add_argument("--max-rank", type=int, default=1500)
    ap.add_argument("--no-enforce-allowed", action="store_true", help="validate realness only, not vocabulary membership")
    ap.add_argument("--demo", action="store_true", help="run offline with a stub generator (no API key needed)")
    args = ap.parse_args()

    cfg = GenConfig(
        model=args.model, n=args.n, topic=args.topic, topic_slug=args.topic_slug,
        level=args.level, max_rank=args.max_rank, enforce_allowed=not args.no_enforce_allowed,
    )
    gate = VoikkoGate(allowed_lemmas=set(load_allowed_lemmas()))

    if args.demo or not os.getenv("ANTHROPIC_API_KEY"):
        if not args.demo:
            print("ANTHROPIC_API_KEY not set — running offline demo of the gate + loop.\n")
        generate_fn = _stub_generate
    else:
        import anthropic
        client = anthropic.Anthropic()
        generate_fn = lambda prompt: call_claude(client, cfg, prompt)

    accepted, stats = generate_validated(cfg, gate, generate_fn)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / "generated_content.json"
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump({"config": vars(cfg), "stats": vars(stats), "rates": stats.rates(),
                   "items": accepted}, fh, ensure_ascii=False, indent=2)

    print(f"Accepted {stats.accepted} validated items over {stats.rounds} round(s).")
    print(f"Candidates: {stats.candidates} | rejected (invented Finnish): {stats.rejected_invented} | "
          f"rejected (out-of-vocabulary): {stats.rejected_oov}")
    print(f"Rejection rates: {stats.rates()}")
    if stats.invented_examples:
        print(f"Invented forms caught (never reach a learner): {sorted(set(stats.invented_examples))}")
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
