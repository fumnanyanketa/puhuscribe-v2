# Content Ingestion Scripts

These scripts replace AI-generated content with real CC-licensed source data.
Run them whenever CC exports are refreshed. Output goes to `supabase/seeds/`.

## Sources

| Source | License | URL | Provides |
|---|---|---|---|
| Leipzig Corpora (Finnish) | CC BY 4.0 | https://wortschatz.uni-leipzig.de/en/download/Finnish | Frequency-ordered vocabulary |
| kaikki.org (Wiktextract JSON) | CC BY-SA | https://kaikki.org/dictionary/Finnish/ | Translations + real IPA |
| Tatoeba `fin` export | CC BY 2.0 FR | https://downloads.tatoeba.org/exports/per_language/fin/ | Sentence pairs (Finnish+English) |
| Tatoeba audio | CC BY | https://downloads.tatoeba.org/exports/ | Native-speaker audio |

## Download Instructions

```bash
# Leipzig: download fin_web_2021_1M.tar.gz (or similar)
# Extract to scripts/ingest/raw/leipzig/

# kaikki.org: download kaikki.org-dictionary-Finnish.json
# Place at scripts/ingest/raw/kaikki/kaikki.org-dictionary-Finnish.json

# Tatoeba: download sentences.csv and links.csv from the fin export page
# Place at scripts/ingest/raw/tatoeba/
```

## Scripts (to implement)

### `01_ingest_vocabulary.ts`
1. Read Leipzig `*_words.txt` (frequency-ranked word list)
2. For each word, look up kaikki.org JSON for: `word`, `pos`, `senses[0].glosses[0]` (English), `sounds[].ipa`
3. Assign to YKI topic based on POS + word list membership
4. Output: `supabase/seeds/01_vocabulary.sql`

### `02_ingest_sentences.ts`
1. Read Tatoeba `sentences.csv` — filter for Finnish (`fin`) sentences with an English (`eng`) link
2. Join `links.csv` to get sentence pairs
3. Filter: A1–A2 vocabulary coverage (cross-reference 01_vocabulary output)
4. Apply rule-based puhekieli transform (see `puhekieli_rules.ts`)
5. Flag transformed pairs as UNVERIFIED — human review required before shipping
6. Output: `supabase/seeds/02_sentences.sql`

### `puhekieli_rules.ts`
Rule-based kirjakieli → puhekieli transform. Deterministic for common cases.
Key rules:
- minä → mä, sinä → sä
- -n drop (word-final): minulla → multa → mulla
- t → d / Ø in medial position (context-dependent)
- question -kö/-ko → -ks
- ei ole → ei oo
- ollaan → ollaa
Always flag regional variants (e.g., -nt- assimilation, vowel harmony differences).

## Important Notes

- **Puhekieli must be human-verified** before going to production. Scripts output
  UNVERIFIED flags; a Finnish speaker must clear each one.
- **Mnemonics**: no CC source exists. Generate after real IPA is in the DB, then
  verify with a Finnish speaker before shipping.
- **Container egress**: this container blocks outbound to Leipzig/kaikki/Tatoeba.
  Download raw files locally and place them in `scripts/ingest/raw/` (gitignored).
