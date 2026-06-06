// scripts/ingest/parse-leipzig.mjs
//
// Parse a Leipzig Corpora Collection "*-words.txt" file (CC BY 4.0) into a
// frequency-ordered word list. This is the ONLY source of frequency ranking
// (project rule: Leipzig CC-BY only — never the Kotus CC-BY-ND-NC lexicon).
//
// Leipzig "-words.txt" format (tab-separated, one word per line):
//   <wordId>\t<word>\t<frequency>
// The file is sorted by descending frequency, and wordId is assigned in that
// order, so wordId IS the frequency rank (1 = most frequent). We defensively
// fall back to line order if the first column is not an integer.
//
// Run directly to inspect:  node scripts/ingest/parse-leipzig.mjs raw/<file>-words.txt

import { readLines, tsv, RAW_DIR } from './lib/io.mjs'
import { resolve } from 'node:path'

/** @typedef {{ rank: number, word: string, freq: number }} LeipzigWord */

// Keep ordinary Finnish dictionary words; drop punctuation tokens and anything
// containing digits. Tokens are lowercased so case variants collapse. Finnish
// letters incl. ä ö å ü, plus the hyphen for compounds. We deliberately do NOT
// filter "proper nouns" by capitalisation — Leipzig capitalises sentence-initial
// common words too, so that heuristic drops real vocabulary. Curation happens
// later (topic map + human review of the generated seed).
const WORD_RE = /^[a-zäöåü]+(-[a-zäöåü]+)*$/

/**
 * @param {string} filePath path to a Leipzig "-words.txt" file
 * @param {{ limit?: number }} [opts]
 * @returns {Promise<LeipzigWord[]>} words in ascending frequency rank
 */
export async function parseLeipzigWords(filePath, opts = {}) {
  const { limit = Infinity } = opts
  /** @type {LeipzigWord[]} */
  const out = []
  const seen = new Set()
  let lineNo = 0

  for await (const raw of readLines(filePath)) {
    lineNo++
    const line = raw.trim()
    if (line.length === 0) continue

    const cols = tsv(line)
    if (cols.length < 3) continue

    const word = cols[1].trim().toLowerCase()
    const parsedRank = Number.parseInt(cols[0], 10)
    const rank = Number.isFinite(parsedRank) ? parsedRank : lineNo
    const freq = Number.parseInt(cols[2], 10) || 0

    if (word.length === 0 || !WORD_RE.test(word)) continue
    if (seen.has(word)) continue // first (highest-frequency) occurrence wins
    seen.add(word)

    out.push({ rank, word, freq })
    if (out.length >= limit) break
  }

  // Stable sort by rank so downstream frequency ordering is deterministic even
  // if the source file is not perfectly ordered.
  out.sort((a, b) => a.rank - b.rank)
  return out
}

// CLI inspection mode.
if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = process.argv[2]
  if (!arg) {
    console.error('usage: node scripts/ingest/parse-leipzig.mjs <path-to-*-words.txt> [limit]')
    process.exit(1)
  }
  const file = arg.startsWith('/') ? arg : resolve(RAW_DIR, arg)
  const limit = Number.parseInt(process.argv[3] ?? '20', 10)
  const words = await parseLeipzigWords(file, { limit })
  console.log(`Parsed ${words.length} words (showing up to ${limit}):`)
  for (const w of words.slice(0, limit)) console.log(`  #${w.rank}\t${w.word}\t(${w.freq})`)
}
