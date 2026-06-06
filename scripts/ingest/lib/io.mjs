// scripts/ingest/lib/io.mjs
//
// Tiny, dependency-free I/O helpers for the ingestion pipeline.
// Everything reads PLAIN UNCOMPRESSED text — decompress the raw corpus
// downloads first (see scripts/ingest/README.md). Node ships gzip but not
// bzip2, and the Tatoeba exports are .bz2, so we keep decompression out of
// the scripts on purpose: one `bunzip2`/`tar x…` step in the runbook keeps
// these modules portable and trivial to audit.

import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Absolute path to scripts/ingest (so callers can resolve raw/ and out/). */
export const INGEST_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const RAW_DIR = resolve(INGEST_DIR, 'raw')
export const OUT_DIR = resolve(INGEST_DIR, 'out')

/**
 * Stream a text file line by line without loading it into memory. The kaikki
 * Finnish JSONL is ~1 GB, so every parser that touches a corpus file MUST use
 * this rather than fs.readFileSync.
 *
 * @param {string} filePath
 * @returns {AsyncGenerator<string>} yields each line (newline stripped)
 */
export async function* readLines(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(
      `Missing input file: ${filePath}\n` +
        `Download and decompress the corpus first — see scripts/ingest/README.md.`,
    )
  }
  const rl = createInterface({
    input: createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })
  for await (const line of rl) yield line
}

/**
 * Split a TSV line into trimmed fields. Tolerates trailing whitespace and
 * skips nothing — callers decide what is malformed.
 * @param {string} line
 * @returns {string[]}
 */
export function tsv(line) {
  return line.split('\t')
}

/** Write a string to scripts/ingest/out/, creating the directory if needed. */
export function writeOut(fileName, contents) {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })
  const dest = resolve(OUT_DIR, fileName)
  writeFileSync(dest, contents, 'utf8')
  return dest
}
