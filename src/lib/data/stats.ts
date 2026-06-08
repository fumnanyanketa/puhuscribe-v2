import { supabase } from '../supabase/client'
import { bucketByUtcDay, computeWeek, computeStreak, sumCounts } from './streak'

/* ---------------------------------------------------------------------------
 * Real per-user progress, derived from the FSRS card + review_log tables.
 * The vocabulary bank is the 'word_production' cards (English -> Finnish).
 * Everything degrades to zero/empty for a brand-new user rather than throwing.
 * ------------------------------------------------------------------------- */

export interface RecentReview {
  fi: string
  en: string
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
  // --- Card state counts (the vocabulary bank) ------------------------------
  const { data: cardRows, error: cardErr } = await supabase
    .from('cards')
    .select('state')
    .eq('user_id', userId)
    .eq('card_type', 'word_production')
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

  // --- Recently reviewed words ----------------------------------------------
  const { data: recentCards, error: recErr } = await supabase
    .from('cards')
    .select('word_id, last_review')
    .eq('user_id', userId)
    .eq('card_type', 'word_production')
    .not('last_review', 'is', null)
    .not('word_id', 'is', null)
    .order('last_review', { ascending: false })
    .limit(5)
  if (recErr) throw new Error(recErr.message)

  const recent: RecentReview[] = []
  const ids = (recentCards ?? []).map((r) => r.word_id as number).filter((id) => id != null)
  if (ids.length > 0) {
    const { data: words, error: wErr } = await supabase
      .from('words')
      .select('id, base_form, translation_en')
      .in('id', ids)
    if (wErr) throw new Error(wErr.message)
    const byId = new Map((words ?? []).map((w) => [w.id, w]))
    for (const rc of recentCards ?? []) {
      const w = byId.get(rc.word_id as number)
      if (!w) continue
      recent.push({ fi: w.base_form, en: w.translation_en })
    }
  }

  return { totalCards, mastered, learning, newRemaining, reviewsThisWeek, streakDays, week, recent }
}
