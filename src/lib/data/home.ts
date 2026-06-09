import { supabase } from '../supabase/client'
import { fetchProgressStats } from './stats'
import { fetchReviewOverview } from './review'

/* The Home dashboard's numbers, gathered in one round trip. All real. */
export interface HomeData {
  bank: number       // words met (word_production cards)
  vocabDue: number   // word reviews due now
  sentDue: number    // sentence reviews due now
  sentBank: number   // personal sentences authored
  sets: number       // sentence sets
  streak: number     // consecutive review days
}

export async function fetchHomeData(userId: string): Promise<HomeData> {
  const [stats, overview, setsRes] = await Promise.all([
    fetchProgressStats(userId),
    fetchReviewOverview(userId),
    supabase.from('user_islands').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  ])
  return {
    bank: overview.vocabBank,
    vocabDue: overview.vocabDue,
    sentDue: overview.sentDue,
    sentBank: overview.sentBank,
    sets: setsRes.count ?? 0,
    streak: stats.streakDays,
  }
}
