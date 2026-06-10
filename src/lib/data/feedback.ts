import { supabase } from '../supabase/client'

/* ---------------------------------------------------------------------------
 * Live beta feedback. Testers tap the floating button, leave a quick note
 * (and an optional mood), and it lands in the public.feedback table for the
 * record, PLUS it emails the owner in real time via the Worker /feedback route
 * (so feedback comes to you, no need to check Supabase). A local backup is kept
 * so nothing is ever lost — even before the migration is run or if a blip hits.
 * ------------------------------------------------------------------------- */

const WORKER = (import.meta.env.VITE_TTS_WORKER_URL as string | undefined)?.replace(/\/+$/, '')

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

// Best-effort email notification through the Worker. Never blocks the UI and
// never throws — if the Worker or its email secrets aren't set, it's a no-op
// and the feedback still lives in Supabase + the local backup.
function notifyByEmail(userId: string | null, input: FeedbackInput): void {
  if (!WORKER) return
  try {
    void fetch(`${WORKER}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: input.message.trim(),
        rating: input.rating ?? null,
        screen: input.screen ?? null,
        userId: userId ?? null,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : null,
      }),
      keepalive: true, // let it finish even if the sheet closes / page navigates
    }).catch(() => { /* notification is best-effort */ })
  } catch { /* ignore */ }
}

export async function submitFeedback(userId: string | null, input: FeedbackInput): Promise<void> {
  // Always keep a local copy first, so a tester's words survive any failure.
  backup(input, userId)
  // Email it to the owner in real time (best-effort, in parallel with the insert).
  notifyByEmail(userId, input)

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
