import type { YkiSkill } from './yki'

/* Per-skill practice counters — real, per-device. Each completed practice
 * session bumps its skill; the hub/progress bars show movement toward a
 * 20-session goal. Honest local data, never fabricated numbers. */

const KEY = 'ps_practice_counts'
export const PRACTICE_GOAL = 20

export type PracticeCounts = Record<YkiSkill, number>

const EMPTY: PracticeCounts = { speak: 0, listen: 0, read: 0, write: 0 }

export function getPracticeCounts(): PracticeCounts {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY }
    const v = JSON.parse(raw) as Partial<PracticeCounts>
    return { ...EMPTY, ...v }
  } catch {
    return { ...EMPTY }
  }
}

export function bumpPracticeCount(skill: YkiSkill): void {
  try {
    const c = getPracticeCounts()
    c[skill] = (c[skill] ?? 0) + 1
    localStorage.setItem(KEY, JSON.stringify(c))
  } catch { /* storage unavailable — counters just don't persist */ }
}
