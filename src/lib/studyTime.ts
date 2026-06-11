import { useEffect, useRef } from 'react'

/* ---------------------------------------------------------------------------
 * Daily study-time tracking. A streak is earned ONLY by genuinely studying for
 * at least 10 minutes in a day — a sustainable, sticky daily habit (and still
 * the deliberate anti-gamification stance vs. Duolingo's one-tap streaks). Time
 * accrues while the learner is actually on a study screen (sprint, recall,
 * speak, listen, read, write). Stored per device in localStorage (a cross-device
 * version would need a DB column later).
 * ------------------------------------------------------------------------- */

const KEY = 'ps_study_seconds' // { 'YYYY-MM-DD': seconds }
export const DAILY_GOAL_MIN = 10

function load(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, number> } catch { return {} }
}
function save(m: Record<string, number>): void {
  try { localStorage.setItem(KEY, JSON.stringify(m)) } catch { /* storage unavailable */ }
}
function dayKey(d = new Date()): string {
  // Local-day key so a learner's "today" matches their wall clock.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addStudySeconds(s: number): void {
  if (!(s > 0)) return
  const m = load()
  const k = dayKey()
  m[k] = (m[k] || 0) + s
  save(m)
}

export function todayStudyMinutes(): number {
  return Math.floor((load()[dayKey()] || 0) / 60)
}

export function metTodayGoal(): boolean {
  return (load()[dayKey()] || 0) >= DAILY_GOAL_MIN * 60
}

/** Consecutive days (ending today, or yesterday if today isn't met yet) with >= the daily goal studied. */
export function studyStreak(): number {
  const m = load()
  const goal = DAILY_GOAL_MIN * 60
  const d = new Date()
  if ((m[dayKey(d)] || 0) < goal) d.setDate(d.getDate() - 1) // today still in progress doesn't break it
  let streak = 0
  while ((m[dayKey(d)] || 0) >= goal) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

/**
 * Accrue study time while the component is mounted. Flushes every 15s and on
 * unmount / tab-hide. Caps each tick at 120s so a backgrounded tab can't inflate
 * the count — only genuine on-screen study time accumulates.
 */
export function useStudyClock(active = true): void {
  const last = useRef<number>(Date.now())
  useEffect(() => {
    if (!active) return
    last.current = Date.now()
    const flush = () => {
      const now = Date.now()
      const sec = Math.min(120, Math.round((now - last.current) / 1000))
      last.current = now
      if (sec > 0) addStudySeconds(sec)
    }
    const id = setInterval(flush, 15000)
    const onVis = () => { if (document.visibilityState === 'hidden') flush() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      flush()
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [active])
}
