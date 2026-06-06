import { supabase } from '../supabase/client'
import { FSRS } from '../fsrs/scheduler'
import { Rating, State } from '../fsrs/types'
import type { Card as FSRSCard } from '../fsrs/types'
import { toRegisterTokens } from './content'
import type { RegisterSentence, CefrLevel } from './content'

export interface SessionCard {
  cardId: string
  sentence: RegisterSentence
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

const fsrs = new FSRS()

function toFSRSCard(card: SessionCard): FSRSCard {
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
export function previewIntervals(card: SessionCard): Record<Rating, string> {
  const now = new Date()
  const fc = toFSRSCard(card)
  const labels: Partial<Record<Rating, string>> = {}
  for (const r of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy]) {
    const { card: next } = fsrs.schedule(fc, r, now)
    labels[r] = fmtInterval(next.scheduled_days, next.due, now)
  }
  return labels as Record<Rating, string>
}

/** Seed all available sentences as new cards for a fresh user. */
export async function seedInitialCards(userId: string): Promise<void> {
  const { data: sentences, error } = await supabase
    .from('sentences')
    .select('id')
    .order('id', { ascending: true })
  if (error) throw new Error(error.message)
  if (!sentences || sentences.length === 0) return

  const now = new Date().toISOString()
  for (let i = 0; i < sentences.length; i += 100) {
    const batch = sentences.slice(i, i + 100).map((s) => ({
      user_id: userId,
      sentence_id: s.id,
      card_type: 'sentence_listening' as const,
      state: 'new' as const,
      due: now,
      stability: 0,
      difficulty: 0,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: 0,
      lapses: 0,
    }))
    const { error: insErr } = await supabase
      .from('cards')
      .upsert(batch, { onConflict: 'user_id,sentence_id,card_type', ignoreDuplicates: true })
    if (insErr) throw new Error(insErr.message)
  }
}

/**
 * Build a daily session: due reviews first, then new cards to fill the limit.
 * Seeds the card table on first call for a new user.
 */
export async function fetchDailySession(userId: string, limit = 8): Promise<SessionCard[]> {
  const now = new Date().toISOString()

  // Seed if this user has no sentence cards yet
  const { count, error: cntErr } = await supabase
    .from('cards')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('sentence_id', 'is', null)
  if (cntErr) throw new Error(cntErr.message)
  if ((count ?? 0) === 0) await seedInitialCards(userId)

  // Due reviews (review / relearning / learning past-due)
  const { data: dueRows, error: dueErr } = await supabase
    .from('cards')
    .select('id, sentence_id, stability, difficulty, state, reps, lapses, due, scheduled_days, elapsed_days, last_review')
    .eq('user_id', userId)
    .not('sentence_id', 'is', null)
    .in('state', ['review', 'relearning', 'learning'])
    .lte('due', now)
    .order('due', { ascending: true })
    .limit(limit)
  if (dueErr) throw new Error(dueErr.message)

  // New cards to fill remaining slots
  const remaining = limit - (dueRows?.length ?? 0)
  let newRows: typeof dueRows = []
  if (remaining > 0) {
    const { data: nr, error: nrErr } = await supabase
      .from('cards')
      .select('id, sentence_id, stability, difficulty, state, reps, lapses, due, scheduled_days, elapsed_days, last_review')
      .eq('user_id', userId)
      .eq('state', 'new')
      .not('sentence_id', 'is', null)
      .order('id', { ascending: true })
      .limit(remaining)
    if (nrErr) throw new Error(nrErr.message)
    newRows = nr ?? []
  }

  const allRows = [...(dueRows ?? []), ...newRows]
  if (allRows.length === 0) return []

  // Fetch sentence content
  const sentenceIds = allRows.map((r) => r.sentence_id as number)
  const { data: sentences, error: sErr } = await supabase
    .from('sentences')
    .select('id, kirjakieli, puhekieli, translation_en, level, topic_id')
    .in('id', sentenceIds)
  if (sErr) throw new Error(sErr.message)

  const byId = new Map((sentences ?? []).map((s) => [s.id, s]))

  return allRows
    .filter((r) => byId.has(r.sentence_id as number))
    .map((r) => {
      const s = byId.get(r.sentence_id as number)!
      const { kirja, puhe } = toRegisterTokens(s.kirjakieli, s.puhekieli ?? s.kirjakieli)
      return {
        cardId: r.id,
        sentence: {
          id: s.id,
          gloss: s.translation_en,
          level: s.level as CefrLevel,
          topicId: s.topic_id,
          kirja,
          puhe,
        },
        isNew: r.state === 'new',
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

/** Persist a rating: update the card's FSRS state and append a review log. */
export async function rateCard(userId: string, card: SessionCard, rating: Rating): Promise<void> {
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
