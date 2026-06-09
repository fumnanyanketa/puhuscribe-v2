import { supabase } from '../supabase/client'
import type { VocabCard } from './cards'
import type { IslandRecallCard } from './islands'

/* ---------------------------------------------------------------------------
 * Daily review is two parallel tracks, never one mixed pile: the VOCABULARY
 * bank (words met) and the SENTENCE islands (the learner's own sentences). The
 * app's north star is to grow both, a little every day — toward ~1000–2000
 * words and ~1000 sentences — so the hub shows each bank's size + what's due.
 * Both tracks run on the same FSRS card engine.
 * ------------------------------------------------------------------------- */

export type ReviewItem =
  | { kind: 'word'; card: VocabCard }
  | { kind: 'island'; card: IslandRecallCard }

export interface ReviewOverview {
  vocabBank: number   // words the learner has met (word_production cards)
  vocabDue: number    // word reviews due now
  sentBank: number    // personal island sentences authored
  sentDue: number     // island sentence reviews due now (incl. brand-new)
}

export async function fetchReviewOverview(userId: string): Promise<ReviewOverview> {
  const now = new Date().toISOString()
  const head = { count: 'exact' as const, head: true }

  const [vBank, vDue, sBank, sDue] = await Promise.all([
    supabase.from('cards').select('*', head).eq('user_id', userId).eq('card_type', 'word_production'),
    supabase.from('cards').select('*', head).eq('user_id', userId).eq('card_type', 'word_production')
      .in('state', ['review', 'learning', 'relearning']).lte('due', now),
    supabase.from('user_island_sentences').select('*', head).eq('user_id', userId),
    supabase.from('cards').select('*', head).eq('user_id', userId).eq('card_type', 'island_recall')
      .not('island_sentence_id', 'is', null).lte('due', now),
  ])

  return {
    vocabBank: vBank.count ?? 0,
    vocabDue: vDue.count ?? 0,
    sentBank: sBank.count ?? 0,
    sentDue: sDue.count ?? 0,
  }
}
