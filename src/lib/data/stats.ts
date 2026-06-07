import { supabase } from '../supabase/client'
import { toRegisterTokens } from './content'
import type { Token } from '../../components/primitives'
import { bucketByUtcDay, computeWeek, computeStreak, sumCounts } from './streak'

/* ---------------------------------------------------------------------------
 * Real per-user progress, derived from the FSRS card + review_log tables.
 * Replaces the mocked numbers on the Progress screen. Everything degrades to
 * zero/empty for a brand-new user rather than throwing.
 * ------------------------------------------------------------------------- */

export interface RecentReview {
  gloss: string
  kirja: Token[]
  puhe: Token[]
}

export interface ProgressStats {
  totalCards: number
  mastered: number        // cards graduated to the 'review' state
  learning: number        // 'learning' + 'relearning'
  newRemaining: number    // 'new'
  reviewsThisWeek: number
  streakDays: number      // consecutive days (UTC) with at least one review, ending today/yesterday
  week: { label: string; count: number }[]  // last 7 days, oldest → newest
  recent: RecentReview[]
}

export async function fetchProgressStats(userId: string): Promise<ProgressStats> {
  // --- Card state counts (one read, tallied client-side) --------------------
  const { data: cardRows, error: cardErr } = await supabase
    .from('cards')
    .select('state')
    .eq('user_id', userId)
    .not('sentence_id', 'is', null)
  if (cardErr) throw new Error(cardErr.message)

  let mastered = 0, learning = 0, newRemaining = 0
  for (const r of cardRows ?? []) {
    if (r.state === 'review') mastered++
    else if (r.state === 'learning' || r.state === 'relearning') learning++
    else if (r.state === 'new') newRemaining++
  }
  const totalCards = cardRows?.length ?? 0

  // --- Reviews over the last 30 days (streak + weekly chart) -----------------
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const { data: logRows, error: logErr } = await supabase
    .from('review_logs')
    .select('review_time')
    .eq('user_id', userId)
    .gte('review_time', since)
    .order('review_time', { ascending: false })
  if (logErr) throw new Error(logErr.message)

  const now = new Date()
  const byDay = bucketByUtcDay((logRows ?? []).map((r) => r.review_time as string))
  const week = computeWeek(byDay, now)
  const reviewsThisWeek = sumCounts(week)
  const streakDays = computeStreak(byDay, now)

  // --- Recently reviewed cards ---------------------------------------------
  const { data: recentCards, error: recErr } = await supabase
    .from('cards')
    .select('sentence_id, last_review')
    .eq('user_id', userId)
    .not('last_review', 'is', null)
    .order('last_review', { ascending: false })
    .limit(5)
  if (recErr) throw new Error(recErr.message)

  const recent: RecentReview[] = []
  const ids = (recentCards ?? []).map((r) => r.sentence_id as number)
  if (ids.length > 0) {
    const { data: sents, error: sErr } = await supabase
      .from('sentences')
      .select('id, kirjakieli, puhekieli, translation_en')
      .in('id', ids)
    if (sErr) throw new Error(sErr.message)
    const byId = new Map((sents ?? []).map((s) => [s.id, s]))
    for (const rc of recentCards ?? []) {
      const s = byId.get(rc.sentence_id as number)
      if (!s) continue
      const { kirja, puhe } = toRegisterTokens(s.kirjakieli, s.puhekieli ?? s.kirjakieli)
      recent.push({ gloss: s.translation_en, kirja, puhe })
    }
  }

  return { totalCards, mastered, learning, newRemaining, reviewsThisWeek, streakDays, week, recent }
}
