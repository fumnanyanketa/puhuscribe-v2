import { supabase } from '../supabase/client'
import { FSRS } from '../fsrs/scheduler'
import { Rating, State } from '../fsrs/types'
import type { Card as FSRSCard } from '../fsrs/types'
import { cleanIpa } from './content'

// FSRS scheduling state shared by every card kind (sentence or vocab).
export interface CardSchedule {
  cardId: string
  isNew: boolean
  // Raw FSRS state — needed to compute rating previews
  stability: number
  difficulty: number
  state: string
  reps: number
  lapses: number
  due: string
  scheduled_days: number
  elapsed_days: number
  last_review: string | null
}

export interface VocabWord { id: number; fi: string; en: string; ipa: string }

// A Day One word that has entered the scheduler. Reviewed as active recall:
// English meaning shown -> produce the Finnish word (card_type 'word_production').
export interface VocabCard extends CardSchedule {
  word: VocabWord
}

const fsrs = new FSRS()

function toFSRSCard(card: CardSchedule): FSRSCard {
  return {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as State,
    last_review: card.last_review ? new Date(card.last_review) : null,
  }
}

function fmtInterval(scheduledDays: number, dueDate: Date, now: Date): string {
  if (scheduledDays === 0) {
    const mins = Math.max(1, Math.round((dueDate.getTime() - now.getTime()) / 60_000))
    return mins < 60 ? `${mins}m` : `${Math.round(mins / 60)}h`
  }
  const d = scheduledDays
  if (d === 1) return '1d'
  if (d < 7) return `${d}d`
  if (d < 30) return `${Math.round(d / 7)}w`
  return `${Math.round(d / 30)}mo`
}

/** Preview next-due label for each rating — shown on the rating buttons. */
export function previewIntervals(card: CardSchedule): Record<Rating, string> {
  const now = new Date()
  const fc = toFSRSCard(card)
  const labels: Partial<Record<Rating, string>> = {}
  for (const r of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy]) {
    const { card: next } = fsrs.schedule(fc, r, now)
    labels[r] = fmtInterval(next.scheduled_days, next.due, now)
  }
  return labels as Record<Rating, string>
}

/** Reset a learner's vocabulary: delete all their cards. review_logs rows
 *  cascade away (FK ON DELETE CASCADE). Needs the 20260608000002 grant. */
export async function resetUserLearning(userId: string): Promise<void> {
  const { error } = await supabase.from('cards').delete().eq('user_id', userId)
  if (error) throw new Error(error.message)
}

/** Persist a rating: update the card's FSRS state and append a review log. */
export async function rateCard(userId: string, card: CardSchedule, rating: Rating): Promise<void> {
  const now = new Date()
  const { card: next, log } = fsrs.schedule(toFSRSCard(card), rating, now)

  const { error: updErr } = await supabase
    .from('cards')
    .update({
      due: next.due.toISOString(),
      stability: next.stability,
      difficulty: next.difficulty,
      elapsed_days: next.elapsed_days,
      scheduled_days: next.scheduled_days,
      reps: next.reps,
      lapses: next.lapses,
      state: next.state,
      last_review: next.last_review?.toISOString() ?? null,
    })
    .eq('id', card.cardId)
    .eq('user_id', userId)
  if (updErr) throw new Error(updErr.message)

  const { error: logErr } = await supabase
    .from('review_logs')
    .insert({
      card_id: card.cardId,
      user_id: userId,
      rating,
      state_before: log.state,
      stability_before: log.stability,
      difficulty_before: log.difficulty,
      elapsed_days: log.elapsed_days,
      scheduled_days: log.scheduled_days,
      review_time: log.review_time.toISOString(),
    })
  if (logErr) throw new Error(logErr.message)
}

/* ---------------------------------------------------------------------------
 * Vocabulary (the Day One Sprint feeds this). A word the learner meets in the
 * sprint enters the scheduler as a 'word_production' card; daily review then
 * resurfaces it as active recall (English meaning -> produce the Finnish word).
 * Per the strategy: only what's been encountered enters the scheduler.
 * ------------------------------------------------------------------------- */

function freshCard(): FSRSCard {
  return {
    due: new Date(), stability: 0, difficulty: 0, elapsed_days: 0,
    scheduled_days: 0, reps: 0, lapses: 0, state: State.New, last_review: null,
  }
}

/**
 * Record that the learner just met a word in the Day One Sprint. Idempotent
 * (one production card per word): a correct recognition seeds a 'Good' first
 * schedule, a miss seeds 'Again' so it comes back sooner. Best-effort: never
 * throws, so it can be fire-and-forget from the sprint runner.
 */
export async function recordWordEncounter(userId: string, wordId: number, correct: boolean): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('cards').select('id')
      .eq('user_id', userId).eq('word_id', wordId).eq('card_type', 'word_production').limit(1)
    if (existing && existing.length > 0) return

    if (correct) {
      // Recognized it → seed a spaced first production review (FSRS 'Good'),
      // so it comes back later, not immediately.
      const { card: next } = fsrs.schedule(freshCard(), Rating.Good, new Date())
      await supabase.from('cards').insert({
        user_id: userId, word_id: wordId, card_type: 'word_production',
        state: next.state, due: next.due.toISOString(),
        stability: next.stability, difficulty: next.difficulty,
        elapsed_days: next.elapsed_days, scheduled_days: next.scheduled_days,
        reps: next.reps, lapses: next.lapses,
        last_review: next.last_review?.toISOString() ?? null,
      })
    } else {
      // Missed it → enter as a fresh 'new' card due NOW, so it shows up in the
      // very next daily review for a production (English -> Finnish) attempt.
      await supabase.from('cards').insert({
        user_id: userId, word_id: wordId, card_type: 'word_production',
        state: 'new', due: new Date().toISOString(),
        stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0,
        last_review: null,
      })
    }
  } catch { /* best-effort: the word just won't seed a review card this time */ }
}

const VOCAB_COLS = 'id, word_id, stability, difficulty, state, reps, lapses, due, scheduled_days, elapsed_days, last_review'

/** A daily vocabulary session: due reviews first, then not-yet-reviewed met words. */
export async function fetchVocabSession(userId: string, limit = 10): Promise<VocabCard[]> {
  const now = new Date().toISOString()

  const { data: dueRows, error: dueErr } = await supabase
    .from('cards').select(VOCAB_COLS)
    .eq('user_id', userId).eq('card_type', 'word_production').not('word_id', 'is', null)
    .in('state', ['review', 'relearning', 'learning']).lte('due', now)
    .order('due', { ascending: true }).limit(limit)
  if (dueErr) throw new Error(dueErr.message)

  const remaining = limit - (dueRows?.length ?? 0)
  let newRows: typeof dueRows = []
  if (remaining > 0) {
    const { data: nr, error: nrErr } = await supabase
      .from('cards').select(VOCAB_COLS)
      .eq('user_id', userId).eq('card_type', 'word_production').not('word_id', 'is', null)
      .eq('state', 'new').order('due', { ascending: true }).limit(remaining)
    if (nrErr) throw new Error(nrErr.message)
    newRows = nr ?? []
  }

  // De-dup by word (guards against any rare double-seed) and load word content.
  const rows = [...(dueRows ?? []), ...newRows]
  const seen = new Set<number>()
  const uniq = rows.filter((r) => {
    const id = r.word_id as number
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
  if (uniq.length === 0) return []

  const { data: words, error: wErr } = await supabase
    .from('words').select('id, base_form, translation_en, ipa').in('id', [...seen])
  if (wErr) throw new Error(wErr.message)
  const byId = new Map((words ?? []).map((w) => [w.id, w]))

  return uniq
    .filter((r) => byId.has(r.word_id as number))
    .map((r) => {
      const w = byId.get(r.word_id as number)!
      return {
        cardId: r.id,
        isNew: r.state === 'new',
        word: { id: w.id, fi: w.base_form, en: w.translation_en, ipa: cleanIpa(w.ipa ?? '') },
        stability: r.stability,
        difficulty: r.difficulty,
        state: r.state,
        reps: r.reps,
        lapses: r.lapses,
        due: r.due,
        scheduled_days: r.scheduled_days,
        elapsed_days: r.elapsed_days,
        last_review: r.last_review,
      }
    })
}
