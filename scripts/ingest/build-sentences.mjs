// scripts/ingest/build-sentences.mjs
//
// Regenerate supabase/seeds/02_sentences.sql from REAL Tatoeba sentence pairs
// (CC BY 2.0 FR) — replacing the previously Claude-generated 500.
//
// IMPORTANT — puhekieli:
//   The shipping SQL sets puhekieli = NULL. Puhekieli has no CC source, so we
//   do NOT auto-fill it. Instead we emit a SEPARATE review file
//   (out/02_puhekieli_REVIEW.tsv) containing the conservative rule-based
//   transform suggestions for a Finnish speaker to verify and approve. Only
//   after human verification should puhekieli be written to the DB.
//
// Usage:
//   node scripts/ingest/build-sentences.mjs \
//        [--fin raw/fin_sentences.tsv] [--eng raw/eng_sentences.tsv] \
//        [--links raw/links.csv] [--audio raw/sentences_with_audio.csv] \
//        [--limit 500] [--out 02_sentences.generated.sql]

import { resolve } from 'node:path'
import { writeOut, RAW_DIR } from './lib/io.mjs'
import { header, sqlStr } from './lib/sql.mjs'
import { levelForRank } from './lib/level.mjs'
import { parseTatoeba } from './parse-tatoeba.mjs'
import { transformSentence } from './puhekieli-transform.mjs'

function parseArgs(argv) {
  const args = { limit: 500, out: '02_sentences.generated.sql' }
  for (let i = 0; i < argv.length; i += 2) {
    const k = argv[i]?.replace(/^--/, '')
    const v = argv[i + 1]
    if (k && v !== undefined) args[k] = v
  }
  args.limit = Number.parseInt(String(args.limit), 10)
  return args
}

// Rough level proxy by sentence length (token count). A heuristic, like the
// vocabulary banding — a curator can refine. Short sentences ≈ A1.
function levelForSentence(fi) {
  const tokens = fi.trim().split(/\s+/).length
  if (tokens <= 4) return 'A1'
  if (tokens <= 7) return 'A2'
  if (tokens <= 11) return 'B1'
  return 'B2'
}

/**
 * Build the sentences seed SQL + the puhekieli review TSV from parsed pairs.
 * Pure and testable.
 * @param {import('./parse-tatoeba.mjs').TatoebaPair[]} pairs
 * @returns {{ sql: string, reviewTsv: string, emitted: number }}
 */
export function buildSentencesSql(pairs) {
  const rows = []
  const review = ['# kirjakieli\tpuhekieli_SUGGESTED (UNVERIFIED — a Finnish speaker must approve)\ttatoeba_fin_id']
  for (const p of pairs) {
    const level = levelForSentence(p.fi)
    // Provenance comment on its OWN line (carrying the Tatoeba id) so the
    // row-separating comma added by join() is never swallowed by the comment.
    rows.push(
      `  -- tatoeba:${p.finId}\n  (${sqlStr(p.fi)}, NULL, ${sqlStr(p.en)}, ${sqlStr(level)}, NULL)`,
    )
    const { puhe, changed } = transformSentence(p.fi)
    review.push(`${p.fi}\t${changed ? puhe : ''}\t${p.finId}`)
  }

  const sql =
    header({
      title: 'PuhuScribe sentence seed (real Finnish/English pairs)',
      sources: [
        'Tatoeba Project (tatoeba.org) — Finnish sentences + English links (CC BY 2.0 FR)',
      ],
      notes: [
        'puhekieli is NULL on purpose — it has no CC source and must be human-verified.',
        'See out/02_puhekieli_REVIEW.tsv for conservative transform suggestions to review.',
        'topic_id is NULL (Tatoeba carries no topic); assign topics as a curation step.',
        'CEFR level is a sentence-length heuristic, not a sourced fact.',
        'Each row comments its source Tatoeba sentence id for attribution.',
      ],
    }) +
    'INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES\n' +
    rows.join(',\n') +
    '\nON CONFLICT DO NOTHING;\n'

  return { sql, reviewTsv: review.join('\n') + '\n', emitted: rows.length }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const opts = { maxPairs: args.limit }
  if (args.fin) opts.finPath = args.fin.startsWith('/') ? args.fin : resolve(RAW_DIR, args.fin)
  if (args.eng) opts.engPath = args.eng.startsWith('/') ? args.eng : resolve(RAW_DIR, args.eng)
  if (args.links) opts.linksPath = args.links.startsWith('/') ? args.links : resolve(RAW_DIR, args.links)
  if (args.audio) opts.audioPath = args.audio.startsWith('/') ? args.audio : resolve(RAW_DIR, args.audio)

  console.log('Building Finnish/English pairs from Tatoeba…')
  const pairs = await parseTatoeba(opts)
  const { sql, reviewTsv, emitted } = buildSentencesSql(pairs)
  const sqlDest = writeOut(args.out, sql)
  const revDest = writeOut('02_puhekieli_REVIEW.tsv', reviewTsv)
  console.log(`✓ Wrote ${emitted} sentences (puhekieli NULL) to ${sqlDest}`)
  console.log(`✓ Wrote puhekieli review suggestions to ${revDest} — verify before shipping puhekieli`)
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
