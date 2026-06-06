import { supabase } from '../supabase/client'
import type { Token } from '../../components/primitives'

/* ---------------------------------------------------------------------------
 * Day One Sprint words (words paired with a public sound-bridge mnemonic)
 * ------------------------------------------------------------------------- */

export interface SprintWord {
  id: number
  fi: string
  en: string
  ipa: string      // phonetic head parsed from the mnemonic, e.g. "TAL-oh"
  bridge: string   // the sound-bridge body
}

// Replace every em dash with a comma so one can never render in the UI, and
// collapse any doubled spaces that leaves behind.
function stripEmDash(s: string): string {
  return s.replace(/\s*—\s*/g, ', ').replace(/\s{2,}/g, ' ').trim()
}

// Split a seeded mnemonic ("TAL-oh ... imagine a TALL building...") into its
// phonetic head and the sound-bridge body on the first em dash separator, then
// scrub any remaining em dashes from both halves.
function parseMnemonic(text: string): { ipa: string; bridge: string } {
  const sep = text.indexOf('—')
  if (sep === -1) return { ipa: '', bridge: stripEmDash(text) }
  return { ipa: stripEmDash(text.slice(0, sep)), bridge: stripEmDash(text.slice(sep + 1)) }
}

/**
 * The Day One Sprint vocabulary: every word that has a public mnemonic.
 * Two flat queries (no embedded select) so type inference stays solid even
 * without Relationships metadata in the generated types.
 */
export async function fetchSprintWords(): Promise<SprintWord[]> {
  const { data: mnem, error: mErr } = await supabase
    .from('mnemonics')
    .select('word_id, text')
    .eq('is_public', true)
  if (mErr) throw new Error(mErr.message)

  const rows = mnem ?? []
  if (rows.length === 0) return []

  // First public mnemonic per word.
  const textByWord = new Map<number, string>()
  for (const r of rows) {
    if (!textByWord.has(r.word_id)) textByWord.set(r.word_id, r.text)
  }

  const wordIds = Array.from(textByWord.keys())
  const { data: words, error: wErr } = await supabase
    .from('words')
    .select('id, base_form, translation_en')
    .in('id', wordIds)
    .order('id', { ascending: true })
  if (wErr) throw new Error(wErr.message)

  return (words ?? []).map((w) => {
    const { ipa, bridge } = parseMnemonic(textByWord.get(w.id) ?? '')
    return { id: w.id, fi: w.base_form, en: w.translation_en, ipa, bridge }
  })
}

/* ---------------------------------------------------------------------------
 * Topics
 * ------------------------------------------------------------------------- */

export interface TopicRow {
  id: number
  slug: string
  name_fi: string
  name_en: string
}

export async function fetchTopics(): Promise<TopicRow[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('id, slug, name_fi, name_en')
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

/* ---------------------------------------------------------------------------
 * Sentences (dual-register, tokenised for the azure flag)
 * ------------------------------------------------------------------------- */

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface RegisterSentence {
  id: number
  gloss: string                 // English translation
  level: CefrLevel
  topicId: number | null
  kirja: Token[]                // kirjakieli tokens
  puhe: Token[]                 // puhekieli tokens
}

export interface FetchSentencesOpts {
  topicId?: number
  level?: CefrLevel
  limit?: number
}

export async function fetchSentences(opts: FetchSentencesOpts = {}): Promise<RegisterSentence[]> {
  let q = supabase
    .from('sentences')
    .select('id, kirjakieli, puhekieli, translation_en, level, topic_id')
  if (opts.topicId != null) q = q.eq('topic_id', opts.topicId)
  if (opts.level) q = q.eq('level', opts.level)
  q = q.order('id', { ascending: true })
  if (opts.limit != null) q = q.limit(opts.limit)

  const { data, error } = await q
  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => {
    const { kirja, puhe } = toRegisterTokens(row.kirjakieli, row.puhekieli ?? row.kirjakieli)
    return { id: row.id, gloss: row.translation_en, level: row.level, topicId: row.topic_id, kirja, puhe }
  })
}

/* ---------------------------------------------------------------------------
 * Register tokenisation + azure-flag diff
 * ------------------------------------------------------------------------- */

// Normalise a token for cross-register comparison: lowercase, strip everything
// that is not a letter (keeps ä/ö/å via the Unicode letter class).
function norm(tok: string): string {
  return tok.toLowerCase().replace(/[^\p{L}]/gu, '')
}

/**
 * Tokenise both registers and flag the tokens that differ between them: the
 * "azure flag" that marks what changes from written to spoken Finnish. A token
 * is hot when its normalised form is absent from the other register.
 */
export function toRegisterTokens(kirja: string, puhe: string): { kirja: Token[]; puhe: Token[] } {
  const kRaw = kirja.trim().split(/\s+/).filter(Boolean)
  const pRaw = puhe.trim().split(/\s+/).filter(Boolean)
  const kSet = new Set(kRaw.map(norm))
  const pSet = new Set(pRaw.map(norm))
  return {
    kirja: kRaw.map((t) => ({ t, hot: norm(t).length > 0 && !pSet.has(norm(t)) })),
    puhe: pRaw.map((t) => ({ t, hot: norm(t).length > 0 && !kSet.has(norm(t)) })),
  }
}
