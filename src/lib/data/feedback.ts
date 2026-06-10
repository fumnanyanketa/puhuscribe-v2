import { supabase } from '../supabase/client'

/* ---------------------------------------------------------------------------
 * Live beta feedback. Testers tap the floating button, leave a quick note
 * (and an optional mood), and it lands in the public.feedback table for the
 * owner to read in the Supabase dashboard. A local backup is kept so nothing
 * is ever lost — even before the migration is run or if the network blips.
 * ------------------------------------------------------------------------- */

export interface FeedbackInput {
  message: string
  rating?: number | null // 1 = needs work, 2 = okay, 3 = love it
  screen?: string
}

const BACKUP_KEY = 'ps_feedback_backup'

function backup(input: FeedbackInput, userId: string | null): void {
  try {
    const raw = localStorage.getItem(BACKUP_KEY)
    const arr = raw ? (JSON.parse(raw) as unknown[]) : []
    arr.push({ ...input, userId, at: new Date().toISOString() })
    localStorage.setItem(BACKUP_KEY, JSON.stringify(arr).slice(0, 60000))
  } catch { /* storage unavailable — nothing more we can do */ }
}

export async function submitFeedback(userId: string | null, input: FeedbackInput): Promise<void> {
  // Always keep a local copy first, so a tester's words survive any failure.
  backup(input, userId)

  const row = {
    user_id: userId,
    message: input.message.trim(),
    rating: input.rating ?? null,
    screen: input.screen ?? null,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : null,
  }
  // `feedback` isn't in the generated Database types, so cast past the typed client.
  const { error } = await (supabase as unknown as {
    from: (t: string) => { insert: (r: unknown) => Promise<{ error: { message: string } | null }> }
  }).from('feedback').insert(row)
  if (error) throw new Error(error.message)
}
