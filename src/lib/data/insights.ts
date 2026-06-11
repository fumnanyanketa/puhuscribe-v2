import { supabase } from '../supabase/client'

/* ---------------------------------------------------------------------------
 * Owner insights — the beta cohort at a glance. Calls the owner_insights()
 * SECURITY DEFINER function (migration 20260611000001), which aggregates
 * across all testers server-side and refuses any caller but the owner.
 * The OWNER_EMAILS list below only gates UI visibility; the database function
 * is the real gate.
 * ------------------------------------------------------------------------- */

export const OWNER_EMAILS = ['aiprotocolslab@gmail.com']

export function isOwner(email: string | undefined | null): boolean {
  return !!email && OWNER_EMAILS.includes(email.toLowerCase())
}

export interface InsightTotals {
  testers: number
  active1: number   // distinct reviewers in the last 24 h
  active7: number   // distinct reviewers in the last 7 days
  reviews7: number  // reviews in the last 7 days
  feedback: number
}

export interface InsightTester {
  email: string
  joined: string
  words: number
  sentences: number
  reviews7: number
  lastActive: string | null
}

export interface InsightFeedback {
  message: string
  rating: number | null
  screen: string | null
  email: string | null
  at: string
}

export interface OwnerInsights {
  totals: InsightTotals
  testers: InsightTester[]
  feedback: InsightFeedback[]
}

export async function fetchOwnerInsights(): Promise<OwnerInsights> {
  // The function isn't in the generated Database types, so cast past the client.
  const { data, error } = await (supabase as unknown as {
    rpc: (fn: string) => Promise<{ data: unknown; error: { message: string } | null }>
  }).rpc('owner_insights')
  if (error) {
    // The likeliest failure: the migration hasn't been run yet.
    if (/function .*owner_insights.* does not exist/i.test(error.message)) {
      throw new Error('Run supabase/migrations/20260611000001_owner_insights.sql in the Supabase SQL editor first.')
    }
    throw new Error(error.message)
  }
  return data as OwnerInsights
}

/** Compact relative time for the tester list ("now", "3 h", "2 d"). */
export function ago(iso: string | null): string {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const min = Math.floor(ms / 60000)
  if (min < 1) return 'now'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h`
  return `${Math.floor(h / 24)} d`
}
