# Grounded content generation with a Voikko validation gate (Phase 2)

This is the fix for the real bug: the content-generation step was producing
**invented Finnish** — words and inflected forms that do not exist. For a
language-learning app that means learners memorise fake words. Two mechanisms,
two different jobs:

1. **The frequency list decides WHICH words the generator may use.**
   `data/finnish_frequency_lemmas.json` (built in Phase 1 from real corpora,
   validated by Voikko) is the allowed vocabulary. The prompt constrains the
   model to these real, common lemmas, at low variance, with correct
   dual-register examples and an explicit "never invent forms" instruction.

2. **Voikko decides whether each generated form is REAL Finnish.**
   After generation, **every** kirjakieli word is run through Voikko
   (`voikko_gate.py`). Any token Voikko cannot analyse as valid Finnish is
   rejected and the item is regenerated or dropped. This guarantees no invented
   form reaches a learner — *regardless of which model produced it*.

This runs in the **Python backend (Linux)**, where Voikko loads. (The Cloudflare
Worker that serves the app cannot run Voikko, so any runtime generation the
Worker does should call this same gate as a service — see "Wiring" below.)

## Files

| File | Role |
|---|---|
| `voikko_gate.py` | `VoikkoGate` — tokenise + validate kirjakieli; the hard guarantee. |
| `allowed_vocab.py` | Load + sample the committed frequency list (the grounding vocabulary). |
| `generate.py` | Grounded generate → validate → regenerate/drop loop; logs the rejection rate. |
| `test_voikko_gate.py` | Tests: real passes, invented rejected, puhekieli not gated, OOV flagged, loop drops invented. |

## Setup

```bash
apt-get install -y libvoikko1 voikko-fi          # system morphology + Finnish dictionary
python3 -m venv .venv && . .venv/bin/activate
pip install -r scripts/requirements.txt
```

## Run

```bash
# One topic (needs ANTHROPIC_API_KEY): 20 A2 pairs, all Voikko-validated.
python scripts/generate/generate.py --n 20 --topic "daily life" --topic-slug daily_routines --level A2

# FULL SET across all 25 YKI topics, then emit the loadable seed SQL:
python scripts/generate/run_batch.py --per-topic 8 --levels A1 A2

# Offline demo (no API key — stub generator deliberately invents two words):
python scripts/generate/generate.py --demo --n 4
python scripts/generate/run_batch.py --demo --per-topic 2 --levels A1 --topics greetings home

# Tests:
.venv/bin/pytest scripts/generate/
```

`run_batch.py` writes `out/generated_content.json` (validated items + aggregate
rejection stats) and produces the load artifacts below.

## Load into Supabase

`run_batch.py` (or `python scripts/generate/to_seed_sql.py` on an existing
`out/generated_content.json`) emits:

- `out/generated_sentences.sql` — idempotent `INSERT ... ON CONFLICT DO NOTHING`
  for the `sentences` table. **Only the Voikko-validated kirjakieli ships;
  puhekieli is `NULL`.** Review it, then run it once in the Supabase SQL editor.
- `out/generated_puhekieli_REVIEW.tsv` — the generated puhekieli for a Finnish
  speaker to verify before it is loaded (puhekieli has no validator and no CC
  source — it never ships unverified).

## Setting the API key (to run live)

`generate.py`/`run_batch.py` call the Claude API only when `ANTHROPIC_API_KEY`
is set in the environment; otherwise they fall back to the offline stub. Set it
as an **environment variable / secret** (never in code or git). In Claude Code on
the web, add it to the environment's configuration so the key is present at run
time.

Validated output is written to `scripts/generate/out/generated_content.json`
(git-ignored), including the per-run rejection stats.

## The two register layers — important

Voikko validates **standard written Finnish (kirjakieli)** only. Spoken Finnish
(**puhekieli**: `mä`, `sä`, `oon`, `sun`, `meil`, …) is *not* standard and Voikko
correctly rejects it — so puhekieli is **not** passed through the gate. The
generator still produces a puhekieli pair for each item, but puhekieli has no
morphological validator and no CC source, so it stays on the **human-verified**
path (consistent with `docs/CONTENT-CORRECTIONS-HANDOFF.md` and
`scripts/ingest/`). The gate's guarantee covers the kirjakieli layer.

## Model & "lower the temperature"

The default model is `claude-sonnet-4-6` — a strong, cheaper model that **does**
accept the `temperature` parameter, so the "lower the temperature" intent is
honoured directly (`temperature=0.2`) alongside low `effort` and structured
outputs. `claude-opus-4-8` is available via `--model` (most capable, but it
removed `temperature`, so there the determinism comes from `effort` + structured
outputs); `claude-haiku-4-5` is the cheapest. The code only sends params each
model accepts — see `_supports_temperature` / `_supports_effort`. Model choice is
configurable and secondary: grounded Claude + the Voikko gate is the fix. If
Finnish naturalness later needs more, a Finnish-native open model (Poro / Viking)
could do the *raw generation* step only, still validated by this same gate.

## Two logged rates

- **invented rate** — tokens Voikko cannot analyse at all (truly invented / non-Finnish). This is "how often the model invents words."
- **out-of-vocabulary rate** — real Finnish whose lemma is outside the allowed list (the generator strayed from the grounding set). Softer signal; toggle with `--no-enforce-allowed`.

## Wiring (follow-up)

Once content is generated and validated here, store only the validated items
(this loop already drops the rest). The natural integration is to make this the
content-seeding path that populates Supabase, and—if the Worker's MCP tools
generate Finnish for learners at runtime—to expose `VoikkoGate.validate()` as a
small backend service the Worker calls before returning generated Finnish. That
service wiring is intentionally out of scope here; this delivers the generator
grounding + the validation guarantee.
