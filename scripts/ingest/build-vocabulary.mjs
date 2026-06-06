// scripts/ingest/build-vocabulary.mjs
//
// Regenerate supabase/seeds/01_vocabulary.sql from REAL Creative Commons data:
//   • Leipzig Corpora (CC BY 4.0)  -> frequency rank + ordering
//   • kaikki.org / Wiktionary (CC BY-SA) -> English gloss + real IPA + POS
//
// A word is only emitted if kaikki has a gloss for it, so the pipeline can
// NEVER ship a word with an invented translation. Words kaikki cannot gloss are
// logged and skipped (the curator can add them by hand with a real source).
//
// Topic assignment is the one curated step: pass --topics <tsv> mapping
// "<word>\t<topic_slug>"; unmapped words get topic_id NULL.
//
// Usage:
//   node scripts/ingest/build-vocabulary.mjs \
//        --leipzig raw/fin_news_2022_300K-words.txt \
//        --kaikki  raw/kaikki-Finnish.jsonl \
//        [--topics raw/topic-map.tsv] [--limit 600] [--out 01_vocabulary.generated.sql]
//
// Output goes to scripts/ingest/out/ for review before it replaces the seed.

import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { readLines, writeOut, tsv, RAW_DIR } from './lib/io.mjs'
import { header, sqlStr, sqlStrOrNull, sqlInt, topicSubselect } from './lib/sql.mjs'
import { levelForRank } from './lib/level.mjs'
import { parseLeipzigWords } from './parse-leipzig.mjs'
import { parseKaikki, primaryGloss, primaryIpa } from './parse-kaikki.mjs'

function parseArgs(argv) {
  const args = { limit: 600, out: '01_vocabulary.generated.sql' }
  for (let i = 0; i < argv.length; i += 2) {
    const k = argv[i]?.replace(/^--/, '')
    const v = argv[i + 1]
    if (k && v !== undefined) args[k] = v
  }
  args.limit = Number.parseInt(String(args.limit), 10)
  return args
}

async function loadTopicMap(path) {
  /** @type {Map<string,string>} */
  const map = new Map()
  if (!path) return map
  const file = path.startsWith('/') ? path : resolve(RAW_DIR, path)
  if (!existsSync(file)) {
    console.warn(`topic map not found at ${file}; all words will get topic_id NULL`)
    return map
  }
  for await (const raw of readLines(file)) {
    if (!raw.trim() || raw.startsWith('#')) continue
    const [word, slug] = tsv(raw)
    if (word && slug) map.set(word.trim().toLowerCase(), slug.trim())
  }
  return map
}

/**
 * Build the seed SQL string from already-parsed inputs. Pure and testable.
 * @param {{ rank:number, word:string }[]} leipzig frequency-ordered words
 * @param {Map<string, import('./parse-kaikki.mjs').KaikkiEntry>} kaikki
 * @param {Map<string,string>} [topicMap]
 * @returns {{ sql: string, emitted: number, skipped: string[] }}
 */
export function buildVocabularySql(leipzig, kaikki, topicMap = new Map()) {
  const rows = []
  const skipped = []
  for (const { rank, word } of leipzig) {
    const entry = kaikki.get(word)
    const gloss = entry ? primaryGloss(entry) : ''
    if (!gloss) {
      skipped.push(word)
      continue
    }
    const ipa = primaryIpa(entry)
    const pos = entry.pos || null
    const slug = topicMap.get(word) || null
    rows.push(
      `  (${sqlStr(word)}, ${sqlStr(gloss)}, ${sqlInt(rank)}, ` +
        `${sqlStr(levelForRank(rank))}, ${sqlStrOrNull(pos)}, ${topicSubselect(slug)}, ${sqlStrOrNull(ipa)})`,
    )
  }

  const sql =
    header({
      title: 'PuhuScribe vocabulary seed (frequency-ordered, real translations + IPA)',
      sources: [
        'Leipzig Corpora Collection — Finnish (CC BY 4.0): frequency rank + ordering',
        'kaikki.org Wiktextract / English Wiktionary (CC BY-SA): English gloss, IPA, part of speech',
      ],
      notes: [
        'Requires the words.ipa column — run migration 20260607000002_add_word_ipa.sql first.',
        'CEFR level is a frequency-band heuristic (see lib/level.mjs), not a sourced fact.',
        'topic_id comes from a human-curated topic map; NULL where a word is unmapped.',
        'Glosses/IPA are from Wiktionary and should still be spot-checked before release.',
      ],
    }) +
    'INSERT INTO words (base_form, translation_en, frequency_rank, level, part_of_speech, topic_id, ipa) VALUES\n' +
    rows.join(',\n') +
    '\nON CONFLICT (base_form) DO NOTHING;\n'

  return { sql, emitted: rows.length, skipped }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.leipzig || !args.kaikki) {
    console.error('required: --leipzig <words.txt> --kaikki <Finnish.jsonl>')
    process.exit(1)
  }
  const leipzigPath = args.leipzig.startsWith('/') ? args.leipzig : resolve(RAW_DIR, args.leipzig)
  const kaikkiPath = args.kaikki.startsWith('/') ? args.kaikki : resolve(RAW_DIR, args.kaikki)

  console.log(`Reading Leipzig frequency list (top ${args.limit})…`)
  const leipzig = await parseLeipzigWords(leipzigPath, { limit: args.limit })
  const wordSet = new Set(leipzig.map((w) => w.word))

  console.log(`Reading kaikki entries for ${wordSet.size} target words…`)
  const kaikki = await parseKaikki(kaikkiPath, { wordSet })

  const topicMap = await loadTopicMap(args.topics)

  const { sql, emitted, skipped } = buildVocabularySql(leipzig, kaikki, topicMap)
  const dest = writeOut(args.out, sql)
  console.log(`✓ Wrote ${emitted} words to ${dest}`)
  console.log(`  Skipped ${skipped.length} words with no Wiktionary gloss` +
    (skipped.length ? `: ${skipped.slice(0, 20).join(', ')}${skipped.length > 20 ? ' …' : ''}` : ''))
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
