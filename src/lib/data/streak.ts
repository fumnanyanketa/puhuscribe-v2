/* ---------------------------------------------------------------------------
 * Pure date-aggregation helpers for the Progress screen stats.
 *
 * Kept free of any Supabase import so the streak/week math (the trickiest part
 * of the stats) is unit-testable without a database or env vars. Days are
 * bucketed by UTC calendar date — simple and consistent; revisit if per-user
 * timezone bucketing is needed later.
 * ------------------------------------------------------------------------- */

export const DAY_INITIAL = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] // getUTCDay(): 0 = Sun

const DAY_MS = 86_400_000

export function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Count timestamps per UTC calendar day. */
export function bucketByUtcDay(times: string[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const t of times) {
    const key = utcDayKey(new Date(t))
    m.set(key, (m.get(key) ?? 0) + 1)
  }
  return m
}

/** Last 7 calendar days (oldest → newest) with a day-initial label and count. */
export function computeWeek(byDay: Map<string, number>, now: Date): { label: string; count: number }[] {
  const week: { label: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS)
    week.push({ label: DAY_INITIAL[d.getUTCDay()], count: byDay.get(utcDayKey(d)) ?? 0 })
  }
  return week
}

/**
 * Consecutive days with ≥1 review, ending today or yesterday. Today not yet
 * reviewed does not break the streak (you still have time today); an empty day
 * before that ends it.
 */
export function computeStreak(byDay: Map<string, number>, now: Date, lookback = 60): number {
  let streak = 0
  for (let i = 0; i < lookback; i++) {
    const key = utcDayKey(new Date(now.getTime() - i * DAY_MS))
    if (byDay.has(key)) streak++
    else if (i === 0) continue // today still open
    else break
  }
  return streak
}

export function sumCounts(week: { count: number }[]): number {
  return week.reduce((acc, d) => acc + d.count, 0)
}
