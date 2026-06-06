// scripts/ingest/parse-tatoeba.mjs
//
// Parse Tatoeba exports (CC BY 2.0 FR) into real, human-written Finnish/English
// sentence pairs — replacing the previously Claude-generated sentences.
//
// Required inputs (decompress the .bz2 downloads first; see README):
//   fin_sentences.tsv   <id>\t<lang>\t<text>   (Finnish; lang == "fin")
//   eng_sentences.tsv   <id>\t<lang>\t<text>   (English; lang == "eng")
//   links.csv           <id1>\t<id2>           (tab-separated despite ".csv")
// Optional:
//   sentences_with_audio.csv  <sentenceId>\t<username>\t<license>\t<attributionUrl>
//
// A pair is emitted when a Finnish sentence links to at least one English
// sentence. The Tatoeba sentence id is preserved so attribution stays exact.
//
// Run directly to inspect:
//   node scripts/ingest/parse-tatoeba.mjs   (uses raw/ default filenames)

import { readLines, tsv, RAW_DIR } from './lib/io.mjs'
import { resolve } from 'node:path'

/** @typedef {{ finId: number, fi: string, enId: number, en: string, hasAudio: boolean, audioAttributionUrl: string|null }} TatoebaPair */

/**
 * Read a Tatoeba "<id>\t<lang>\t<text>" sentence file into a Map<id, text>,
 * optionally filtering to a single language code.
 * @param {string} filePath
 * @param {string|null} langFilter e.g. "fin" or "eng"; null keeps all
 * @returns {Promise<Map<number, string>>}
 */
async function readSentences(filePath, langFilter) {
  /** @type {Map<number, string>} */
  const map = new Map()
  for await (const raw of readLines(filePath)) {
    if (raw.length === 0) continue
    const cols = tsv(raw)
    if (cols.length < 3) continue
    const id = Number.parseInt(cols[0], 10)
    if (!Number.isFinite(id)) continue
    if (langFilter && cols[1] !== langFilter) continue
    const text = cols[2].trim()
    if (text.length > 0) map.set(id, text)
  }
  return map
}

/** Read sentences_with_audio.csv into id -> attributionUrl (or '' if absent). */
async function readAudioIndex(filePath) {
  /** @type {Map<number, string>} */
  const map = new Map()
  for await (const raw of readLines(filePath)) {
    if (raw.length === 0) continue
    const cols = tsv(raw)
    const id = Number.parseInt(cols[0], 10)
    if (!Number.isFinite(id)) continue
    map.set(id, (cols[3] ?? '').trim())
  }
  return map
}

/**
 * @param {{
 *   finPath?: string, engPath?: string, linksPath?: string, audioPath?: string,
 *   maxPairs?: number
 * }} [opts]
 * @returns {Promise<TatoebaPair[]>}
 */
export async function parseTatoeba(opts = {}) {
  const {
    finPath = resolve(RAW_DIR, 'fin_sentences.tsv'),
    engPath = resolve(RAW_DIR, 'eng_sentences.tsv'),
    linksPath = resolve(RAW_DIR, 'links.csv'),
    audioPath = null,
    maxPairs = Infinity,
  } = opts

  const fin = await readSentences(finPath, 'fin')
  const eng = await readSentences(engPath, 'eng')
  const audio = audioPath ? await readAudioIndex(audioPath) : new Map()

  /** @type {TatoebaPair[]} */
  const pairs = []
  const usedFin = new Set()

  // links.csv pairs ids in both directions; we want fin -> eng. Scan once and
  // accept whichever side is Finnish.
  for await (const raw of readLines(linksPath)) {
    if (raw.length === 0) continue
    const cols = tsv(raw)
    if (cols.length < 2) continue
    const a = Number.parseInt(cols[0], 10)
    const b = Number.parseInt(cols[1], 10)
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue

    let finId = null
    let enId = null
    if (fin.has(a) && eng.has(b)) {
      finId = a
      enId = b
    } else if (fin.has(b) && eng.has(a)) {
      finId = b
      enId = a
    } else {
      continue
    }

    if (usedFin.has(finId)) continue // first English translation per Finnish sentence
    usedFin.add(finId)

    pairs.push({
      finId,
      fi: fin.get(finId),
      enId,
      en: eng.get(enId),
      hasAudio: audio.has(finId),
      audioAttributionUrl: audio.get(finId) || null,
    })
    if (pairs.length >= maxPairs) break
  }

  // Deterministic order by Finnish sentence id.
  pairs.sort((p1, p2) => p1.finId - p2.finId)
  return pairs
}

// CLI inspection mode.
if (import.meta.url === `file://${process.argv[1]}`) {
  const pairs = await parseTatoeba({ maxPairs: Number.parseInt(process.argv[2] ?? '15', 10) })
  console.log(`Built ${pairs.length} Finnish/English pairs:`)
  for (const p of pairs) console.log(`  [${p.finId}] ${p.fi}  ⇄  ${p.en}${p.hasAudio ? '  🔊' : ''}`)
}
