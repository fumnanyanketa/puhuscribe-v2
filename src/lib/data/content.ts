import { supabase } from '../supabase/client'
import type { Token } from '../../components/primitives'

/* ---------------------------------------------------------------------------
 * Day One Sprint words — the highest-frequency vocabulary, shown with their
 * REAL IPA pronunciation (words.ipa, sourced from kaikki.org / Wiktionary).
 * No longer driven by the old "sounds-like" mnemonics, which taught wrong
 * pronunciations and are retired from the UI.
 * ------------------------------------------------------------------------- */

export interface SprintWord {
  id: number
  fi: string
  en: string
  ipa: string      // real IPA, e.g. /ˈhyʋæ/; '' until the kaikki IPA migration is loaded
}

// Strip nonspacing combining marks (Unicode Mn) — e.g. the diphthong off-glide
// U+032F in /ˈyø̯tæ/. Many phone fonts can't render these and show a tofu box,
// so we drop them: the spacing IPA letters + stress/length marks (modifier
// letters) stay, the un-drawable diacritics go. Never invents pronunciation.
export function cleanIpa(ipa: string): string {
  return ipa.replace(/\p{Mn}+/gu, '')
}

/**
 * The Day One Sprint vocabulary: the most frequent words first, each shown with
 * its real IPA. Until words.ipa is populated the ipa is simply blank (word +
 * meaning only) — never a wrong "sounds-like" guess.
 */
export async function fetchSprintWords(limit = 150): Promise<SprintWord[]> {
  const { data, error } = await supabase
    .from('words')
    .select('id, base_form, translation_en, ipa')
    .order('frequency_rank', { ascending: true, nullsFirst: false })
    .limit(limit)
  if (error) throw new Error(error.message)

  return (data ?? []).map((w) => ({
    id: w.id,
    fi: w.base_form,
    en: w.translation_en,
    ipa: cleanIpa(w.ipa ?? ''),
  }))
}

/**
 * The daily vocabulary intake: the next `n` most-frequent words the learner has
 * NOT met yet (no 'word_production' card). Frequency-ordered, so they always get
 * the most useful next words, and it continues forward automatically as the bank
 * grows. Returns [] once every word has been met.
 */
export async function fetchNextWords(userId: string, n: number): Promise<SprintWord[]> {
  const { data: cardRows, error: cErr } = await supabase
    .from('cards').select('word_id')
    .eq('user_id', userId).eq('card_type', 'word_production').not('word_id', 'is', null)
  if (cErr) throw new Error(cErr.message)
  const met = new Set((cardRows ?? []).map((r) => r.word_id as number))

  const { data, error } = await supabase
    .from('words')
    .select('id, base_form, translation_en, ipa')
    .order('frequency_rank', { ascending: true, nullsFirst: false })
    .limit(met.size + n + 30) // headroom so n unmet remain after filtering
  if (error) throw new Error(error.message)

  return (data ?? [])
    .filter((w) => !met.has(w.id))
    .slice(0, n)
    .map((w) => ({ id: w.id, fi: w.base_form, en: w.translation_en, ipa: cleanIpa(w.ipa ?? '') }))
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

/**
 * The curated "first useful sentences" set for speaking practice — the everyday
 * survival phrases a newcomer needs (topic slug 'arki'). Falls back to general
 * sentences until that seed is loaded, so the screen always has content.
 */
export async function fetchIslandSentences(limit = 12): Promise<RegisterSentence[]> {
  const { data: topic } = await supabase.from('topics').select('id').eq('slug', 'arki').maybeSingle()
  if (topic?.id != null) {
    const curated = await fetchSentences({ topicId: topic.id, limit })
    if (curated.length > 0) return curated
  }
  return fetchSentences({ limit })
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
