// scripts/ingest/parse-kaikki.mjs
//
// Parse kaikki.org Wiktextract JSONL for Finnish (CC BY-SA, derived from
// English Wiktionary) into real translations + real IPA + part of speech.
//
// This is the layer that ELIMINATES the invented "sounds-like" pronunciation
// problem: kaikki gives the genuine IPA (e.g. hyvä -> /ˈhyʋæ/) straight from
// Wiktionary, so the app can SHOW correct phonology instead of anglicised
// guesses.
//
// Each line of the kaikki dump is one JSON object. Fields we use:
//   word        - the headword (string)
//   lang_code   - "fi" for Finnish
//   pos         - part of speech ("noun", "verb", "adj", ...)
//   senses[]    - { glosses: string[] }   (English definitions)
//   sounds[]    - { ipa: string }         (IPA strings, usually /.../)
//
// The file is huge (~1 GB), so it is streamed line by line and — when a target
// word set is supplied — only matching words are retained.
//
// Run directly to inspect a few words:
//   node scripts/ingest/parse-kaikki.mjs raw/kaikki-Finnish.jsonl hyvä kissa talo

import { readLines, RAW_DIR } from './lib/io.mjs'
import { resolve } from 'node:path'

/** @typedef {{ word: string, pos: string, glosses: string[], ipa: string[] }} KaikkiEntry */

// Content parts of speech worth teaching. We skip affixes, punctuation marks,
// phrases tagged as e.g. "character", etc. (kept permissive but not noisy).
const CONTENT_POS = new Set([
  'noun', 'verb', 'adj', 'adv', 'pron', 'num', 'name', 'intj', 'conj', 'adp', 'particle', 'det',
])

/** Pick IPA strings that look like real transcriptions (/.../ or [...]). */
function extractIpa(sounds) {
  if (!Array.isArray(sounds)) return []
  const out = []
  for (const s of sounds) {
    if (s && typeof s.ipa === 'string' && s.ipa.trim().length > 0) out.push(s.ipa.trim())
  }
  return out
}

/** Flatten senses[].glosses into a clean, de-duplicated gloss list. */
function extractGlosses(senses) {
  if (!Array.isArray(senses)) return []
  const seen = new Set()
  const out = []
  for (const sense of senses) {
    const glosses = sense && Array.isArray(sense.glosses) ? sense.glosses : []
    for (const g of glosses) {
      const t = typeof g === 'string' ? g.trim() : ''
      if (t.length > 0 && !seen.has(t)) {
        seen.add(t)
        out.push(t)
      }
    }
  }
  return out
}

/**
 * @param {string} filePath path to the kaikki Finnish JSONL dump
 * @param {{ wordSet?: Set<string> }} [opts] if given, only these (lowercased) words are kept
 * @returns {Promise<Map<string, KaikkiEntry>>} keyed by lowercased headword
 */
export async function parseKaikki(filePath, opts = {}) {
  const { wordSet } = opts
  /** @type {Map<string, KaikkiEntry>} */
  const byWord = new Map()
  let lineNo = 0

  for await (const raw of readLines(filePath)) {
    lineNo++
    const line = raw.trim()
    if (line.length === 0) continue

    let obj
    try {
      obj = JSON.parse(line)
    } catch {
      continue // tolerate the occasional malformed line rather than abort a 1 GB run
    }

    if (!obj || obj.lang_code !== 'fi' || typeof obj.word !== 'string') continue
    const pos = typeof obj.pos === 'string' ? obj.pos : ''
    if (pos && CONTENT_POS.size > 0 && !CONTENT_POS.has(pos)) continue

    const key = obj.word.toLowerCase()
    if (wordSet && !wordSet.has(key)) continue

    const glosses = extractGlosses(obj.senses)
    const ipa = extractIpa(obj.sounds)
    if (glosses.length === 0 && ipa.length === 0) continue

    const existing = byWord.get(key)
    if (!existing) {
      byWord.set(key, { word: obj.word, pos, glosses, ipa })
    } else {
      // Merge multiple Wiktionary entries for the same headword (e.g. several
      // parts of speech). Keep the first POS, union glosses and IPA.
      for (const g of glosses) if (!existing.glosses.includes(g)) existing.glosses.push(g)
      for (const p of ipa) if (!existing.ipa.includes(p)) existing.ipa.push(p)
    }
  }

  return byWord
}

/**
 * Choose a single concise English gloss for a vocab card from a kaikki entry.
 * Joins up to `max` glosses with " / " (matching the existing seed style like
 * "to be able to / can"). Returns '' if the entry has no glosses.
 * @param {KaikkiEntry} entry
 * @param {number} [max]
 */
export function primaryGloss(entry, max = 2) {
  if (!entry || entry.glosses.length === 0) return ''
  return entry.glosses.slice(0, max).join(' / ')
}

/** The first IPA transcription, or '' if none. @param {KaikkiEntry} entry */
export function primaryIpa(entry) {
  return entry && entry.ipa.length > 0 ? entry.ipa[0] : ''
}

// CLI inspection mode.
if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2]
  if (!file) {
    console.error('usage: node scripts/ingest/parse-kaikki.mjs <kaikki-Finnish.jsonl> [word ...]')
    process.exit(1)
  }
  const path = file.startsWith('/') ? file : resolve(RAW_DIR, file)
  const targets = process.argv.slice(3).map((w) => w.toLowerCase())
  const wordSet = targets.length ? new Set(targets) : undefined
  const map = await parseKaikki(path, { wordSet })
  console.log(`Parsed ${map.size} Finnish entries.`)
  for (const w of targets.length ? targets : Array.from(map.keys()).slice(0, 10)) {
    const e = map.get(w)
    if (!e) {
      console.log(`  ${w}: (not found)`)
      continue
    }
    console.log(`  ${e.word} [${e.pos}]  ipa=${primaryIpa(e) || '—'}  gloss="${primaryGloss(e)}"`)
  }
}
