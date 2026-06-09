# Content ingestion pipeline

Reproducible scripts that turn the **real Creative Commons corpora** into the
PuhuScribe seed SQL. They exist so Finnish content is **never hand-typed or
AI-guessed again** — the root cause of the early content-quality problems
(LLM-generated Finnish with CC attribution attached on top).

> **Why this is needed:** earlier sessions *generated* the vocabulary, sentences
> and mnemonics with an LLM and then attached CC attribution on top. The data
> never came from Leipzig / Tatoeba / Wiktionary. This pipeline replaces that
> generated content with the genuine sourced data the project always intended.

Everything here is **dependency-free** (plain Node ESM `.mjs`, Node ≥ 18) and
**unit-tested** against fixtures (`npm run test` → `scripts/ingest/ingest.test.mjs`),
so the parsers are known-good even though they must be run where the corpora are
reachable (this repo's CI/dev container blocks egress to the corpus hosts).

---

## The sources (all Creative Commons)

| Layer | Source | License | Download |
|---|---|---|---|
| Frequency rank + word ordering | Leipzig Corpora Collection — Finnish | **CC BY 4.0** | https://wortschatz.uni-leipzig.de/en/download/Finnish |
| English gloss + **real IPA** + part of speech | kaikki.org Wiktextract (English Wiktionary) | **CC BY-SA** | https://kaikki.org/dictionary/Finnish/ |
| Sentence pairs (Finnish + English) | Tatoeba Project | **CC BY 2.0 FR** | https://downloads.tatoeba.org/exports/per_language/fin/ |
| Audio (native voices, optional) | Tatoeba audio | **CC BY 2.0 FR** | https://downloads.tatoeba.org/exports/ |

> ⚠️ **Do NOT use the Kotus frequency lexicon** (CC BY-ND-NC) — its
> NonCommercial/NoDerivatives terms are incompatible with this app. Leipzig only.

---

## 1. Download & decompress into `raw/`

`raw/` and `out/` are git-ignored. Create `raw/` and place these **uncompressed**
files in it (the scripts read plain text; Node ships gzip but not bzip2, so
decompress the Tatoeba `.bz2` exports yourself — one step, keeps the scripts
trivial to audit):

```
scripts/ingest/raw/
  fin_news_2022_300K-words.txt     # from a Leipzig "Finnish" package (any size; -words.txt)
  kaikki-Finnish.jsonl             # kaikki.org "Finnish" Wiktextract JSONL (~1 GB)
  fin_sentences.tsv                # Tatoeba: bunzip2 fin_sentences.tsv.bz2
  eng_sentences.tsv                # Tatoeba per_language/eng/eng_sentences.tsv (for English text)
  links.csv                        # Tatoeba: bunzip2 links.csv.bz2 (tab-separated despite .csv)
  sentences_with_audio.csv         # Tatoeba (optional, for audio attribution)
  topic-map.tsv                    # OPTIONAL, hand-curated: "<word>\t<topic_slug>" per line
```

Expected raw formats (so you can sanity-check a download):

- **Leipzig `*-words.txt`** — `<rank>\t<word>\t<frequency>`, sorted by descending
  frequency (rank column = frequency rank, 1 = most frequent).
- **kaikki JSONL** — one JSON object per line: `{ "word", "lang_code":"fi", "pos",
  "senses":[{"glosses":[...]}], "sounds":[{"ipa":"/.../"}] }`.
- **Tatoeba `*_sentences.tsv`** — `<id>\t<lang>\t<text>` (`fin` / `eng`).
- **Tatoeba `links.csv`** — `<id1>\t<id2>` (tab-separated).
- **Tatoeba `sentences_with_audio.csv`** — `<id>\t<username>\t<license>\t<attributionUrl>`.

## 2. Generate the seeds

```bash
# Vocabulary: Leipzig frequency × kaikki gloss/IPA  →  out/01_vocabulary.generated.sql
node scripts/ingest/build-vocabulary.mjs \
     --leipzig fin_news_2022_300K-words.txt \
     --kaikki  kaikki-Finnish.jsonl \
     --topics  topic-map.tsv \
     --limit   600

# Sentences: Tatoeba fin↔eng  →  out/02_sentences.generated.sql  +  out/02_puhekieli_REVIEW.tsv
node scripts/ingest/build-sentences.mjs --audio sentences_with_audio.csv --limit 500
```

Inspection helpers (no output files):

```bash
node scripts/ingest/parse-leipzig.mjs raw/fin_news_2022_300K-words.txt 30
node scripts/ingest/parse-kaikki.mjs  raw/kaikki-Finnish.jsonl hyvä talo työ
node scripts/ingest/parse-tatoeba.mjs 15
```

## 3. Review, then load

1. **Read `out/01_vocabulary.generated.sql`.** Translations/IPA come from
   Wiktionary; spot-check a sample. Words with no Wiktionary gloss are skipped
   (never emitted with a guessed translation) and listed in the run log.
2. Run **`supabase/migrations/20260607000002_add_word_ipa.sql`** once (adds the
   `words.ipa` column the vocabulary seed populates).
3. Load `out/01_vocabulary.generated.sql` and `out/02_sentences.generated.sql`
   in the Supabase SQL editor (both `ON CONFLICT DO NOTHING`).

## The honest gap — puhekieli

There is **no CC parallel kirjakieli↔puhekieli corpus.** `build-sentences.mjs`
therefore ships `puhekieli = NULL` and writes draft suggestions to
`out/02_puhekieli_REVIEW.tsv` using a deliberately **conservative** rule-based
transform (`puhekieli-transform.mjs`: `minä→mä`, `sinä→sä`, `olen→oon`,
participle final-`t` drop, …). **A Finnish speaker must verify each suggestion
before any puhekieli is written to the database.** Never ship the transform
output raw.

## Mnemonics

Deferred. No CC source exists, and the previously generated sound-bridges taught
wrong phonology. Lead with **real IPA** (now sourced from kaikki) and audio
instead. If mnemonics return, generate then have a Finnish speaker verify before
they go live.

## Attribution

Keep `docs/content-attribution.md` truthful and in sync with whatever is
actually loaded. Generated seed files carry a provenance header, and each
sentence row comments its source Tatoeba id.
