// scripts/ingest/ingest.test.mjs
//
// Verifies the ingestion pipeline against small fixtures that mirror the exact
// real formats of Leipzig / kaikki / Tatoeba. These tests are the contract that
// lets us ship the parsers "ready to run" even though this container cannot
// reach the live corpora — when the owner drops real exports into raw/, the
// same code path runs.

import { describe, it, expect } from 'vitest'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseLeipzigWords } from './parse-leipzig.mjs'
import { parseKaikki, primaryGloss, primaryIpa } from './parse-kaikki.mjs'
import { parseTatoeba } from './parse-tatoeba.mjs'
import { buildVocabularySql } from './build-vocabulary.mjs'
import { buildSentencesSql } from './build-sentences.mjs'
import { transformToken, transformSentence } from './puhekieli-transform.mjs'
import { sqlStr, sqlStrOrNull, sqlInt, topicSubselect } from './lib/sql.mjs'
import { levelForRank } from './lib/level.mjs'

const FIX = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures')

describe('parseLeipzigWords', () => {
  it('keeps lowercase alpha/hyphen words in rank order, drops digits/punct, dedups', async () => {
    const words = await parseLeipzigWords(resolve(FIX, 'leipzig-words.txt'))
    expect(words.map((w) => w.word)).toEqual(['minä', 'olla', 'hyvä', 'talo', 'kahvi-kuppi'])
    // "Talo" (rank 4) lowercases to talo; the later duplicate "talo" (rank 8) is dropped.
    expect(words.find((w) => w.word === 'talo').rank).toBe(4)
  })

  it('honours limit', async () => {
    const words = await parseLeipzigWords(resolve(FIX, 'leipzig-words.txt'), { limit: 2 })
    expect(words.map((w) => w.word)).toEqual(['minä', 'olla'])
  })
})

describe('parseKaikki', () => {
  it('parses Finnish entries, merges duplicates, skips non-fi and malformed lines', async () => {
    const map = await parseKaikki(resolve(FIX, 'kaikki-sample.jsonl'))
    expect(map.has('house')).toBe(false) // English entry skipped (lang_code !== fi)
    expect(map.size).toBe(4) // minä, olla, hyvä, talo

    const hyva = map.get('hyvä')
    expect(primaryIpa(hyva)).toBe('/ˈhyʋæ/')
    expect(hyva.glosses).toContain('good')
    expect(hyva.glosses).toContain('the good') // merged from the second entry
    expect(hyva.pos).toBe('adj') // first POS wins

    expect(primaryGloss(map.get('talo'))).toBe('house / building')
    expect(primaryIpa(map.get('talo'))).toBe('/ˈtɑlo/')
  })

  it('filters to a target word set when given', async () => {
    const map = await parseKaikki(resolve(FIX, 'kaikki-sample.jsonl'), { wordSet: new Set(['talo']) })
    expect(Array.from(map.keys())).toEqual(['talo'])
  })
})

describe('parseTatoeba', () => {
  it('builds fin/eng pairs from links (both directions), dedups, flags audio', async () => {
    const pairs = await parseTatoeba({
      finPath: resolve(FIX, 'fin_sentences.tsv'),
      engPath: resolve(FIX, 'eng_sentences.tsv'),
      linksPath: resolve(FIX, 'links.csv'),
      audioPath: resolve(FIX, 'sentences_with_audio.csv'),
    })
    expect(pairs.map((p) => p.finId)).toEqual([101, 102, 103]) // sorted, 999 (no fin/eng) skipped
    expect(pairs[0]).toMatchObject({ fi: 'Minä olen kotona.', en: 'I am at home.' })
    const t102 = pairs.find((p) => p.finId === 102)
    expect(t102.hasAudio).toBe(true)
    expect(t102.audioAttributionUrl).toContain('tatoeba.org')
    expect(pairs.find((p) => p.finId === 103).hasAudio).toBe(false)
  })
})

describe('buildVocabularySql', () => {
  it('emits only words with a real gloss, includes IPA, skips ungloss able words', async () => {
    const leipzig = await parseLeipzigWords(resolve(FIX, 'leipzig-words.txt'))
    const kaikki = await parseKaikki(resolve(FIX, 'kaikki-sample.jsonl'))
    const { sql, emitted, skipped } = buildVocabularySql(leipzig, kaikki, new Map([['talo', 'home']]))

    expect(emitted).toBe(4) // kahvi-kuppi has no kaikki gloss -> skipped
    expect(skipped).toEqual(['kahvi-kuppi'])
    expect(sql).toContain('part_of_speech, topic_id, ipa) VALUES')
    expect(sql).toContain("('hyvä', 'good / the good', 3, 'A1', 'adj', NULL, '/ˈhyʋæ/')")
    expect(sql).toContain("('talo', 'house / building', 4, 'A1', 'noun', (SELECT id FROM topics WHERE slug = 'home'), '/ˈtɑlo/')")
    expect(sql).toContain('ON CONFLICT (base_form) DO NOTHING;')
  })
})

describe('buildSentencesSql', () => {
  it('ships puhekieli=NULL, carries Tatoeba id, and writes review suggestions', async () => {
    const pairs = await parseTatoeba({
      finPath: resolve(FIX, 'fin_sentences.tsv'),
      engPath: resolve(FIX, 'eng_sentences.tsv'),
      linksPath: resolve(FIX, 'links.csv'),
    })
    const { sql, reviewTsv, emitted } = buildSentencesSql(pairs)
    expect(emitted).toBe(3)
    // Provenance comment on its own line, then the tuple — so the row comma is
    // never commented out (regression guard for the swallowed-comma bug).
    expect(sql).toContain("-- tatoeba:101\n  ('Minä olen kotona.', NULL, 'I am at home.', 'A1', NULL)")
    expect(sql).not.toMatch(/tatoeba:\d+,/) // a comma after the id would be inside the comment
    expect(sql).toContain('ON CONFLICT DO NOTHING;')
    // review file: transformed suggestion present and clearly marked unverified
    expect(reviewTsv).toContain('UNVERIFIED')
    expect(reviewTsv).toContain('Mä oon kotona.\t101')
  })
})

describe('puhekieli transform (conservative, draft only)', () => {
  it('substitutes pronouns and copula, preserving capitalisation', () => {
    expect(transformSentence('Minä olen kotona.').puhe).toBe('Mä oon kotona.')
    expect(transformSentence('Sinä olet hyvä.').puhe).toBe('Sä oot hyvä.')
    expect(transformSentence('Hän on asunut täällä.').puhe).toBe('Se on asunu täällä.')
  })

  it('does not touch the adverb "nyt" (suffix-rule exception)', () => {
    expect(transformToken('nyt')).toEqual({ token: 'nyt', changed: false })
    expect(transformToken('Nyt!')).toEqual({ token: 'Nyt!', changed: false })
  })

  it('reports changed=false when nothing applies', () => {
    expect(transformSentence('Talo on iso.').changed).toBe(false)
  })
})

describe('sql helpers', () => {
  it('escapes quotes and handles NULLs', () => {
    expect(sqlStr('ole hyvä')).toBe("'ole hyvä'")
    expect(sqlStr("don't")).toBe("'don''t'")
    expect(sqlStrOrNull('')).toBe('NULL')
    expect(sqlStrOrNull('   ')).toBe('NULL')
    expect(sqlInt(5)).toBe('5')
    expect(sqlInt(null)).toBe('NULL')
    expect(topicSubselect('food')).toBe("(SELECT id FROM topics WHERE slug = 'food')")
    expect(topicSubselect(null)).toBe('NULL')
  })
})

describe('levelForRank heuristic', () => {
  it('bands by frequency', () => {
    expect(levelForRank(1)).toBe('A1')
    expect(levelForRank(250)).toBe('A1')
    expect(levelForRank(251)).toBe('A2')
    expect(levelForRank(600)).toBe('A2')
    expect(levelForRank(601)).toBe('B1')
    expect(levelForRank(1500)).toBe('B1')
    expect(levelForRank(1501)).toBe('B2')
  })
})
