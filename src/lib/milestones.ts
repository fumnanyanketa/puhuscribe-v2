/* ---------------------------------------------------------------------------
 * Milestones & ranks — the visible "climb" that runs underneath the journey
 * stages. As the learner's vocabulary bank grows, they pass word milestones,
 * each carrying a rank title; crossing one fires a celebration. This is the
 * granular progress signal (it moves most days), beneath the four big journey
 * stages (Foundation -> Grammar -> B1 -> B2).
 *
 * Rank titles are real, common Finnish words — they should go through the same
 * native-speaker review pass as the rest of the user-facing Finnish.
 * ------------------------------------------------------------------------- */

export interface Milestone {
  words: number
  fi: string
  en: string
  emoji: string
}

// Word-count milestones, ascending. The last one == the Stage 1 word goal.
export const MILESTONES: Milestone[] = [
  { words: 50, fi: 'Ensiaskeleet', en: 'First steps', emoji: '🌱' },
  { words: 100, fi: 'Aloittelija', en: 'Beginner', emoji: '🌿' },
  { words: 250, fi: 'Pärjääjä', en: 'Getting by', emoji: '🙂' },
  { words: 500, fi: 'Selviytyjä', en: 'Survivor', emoji: '💪' },
  { words: 1000, fi: 'Puhuja', en: 'Speaker', emoji: '🗣️' },
  { words: 2000, fi: 'Perusta valmis', en: 'Foundation complete', emoji: '⭐' },
]

export interface RankState {
  level: number              // milestones reached so far (0 before the first)
  rank: Milestone | null     // the highest milestone reached (null before 50)
  next: Milestone | null     // the next milestone to reach (null once all done)
  toNext: number             // words remaining to the next milestone (0 if none)
  pctToNext: number          // 0-100 progress from the previous milestone to the next
}

/** Where the learner stands on the ladder for a given word-bank size. */
export function rankState(words: number): RankState {
  const reached = MILESTONES.filter((m) => words >= m.words)
  const level = reached.length
  const rank = reached.length ? reached[reached.length - 1] : null
  const next = MILESTONES[level] ?? null
  const prevWords = rank ? rank.words : 0
  const toNext = next ? Math.max(0, next.words - words) : 0
  const span = next ? next.words - prevWords : 1
  const pctToNext = next ? Math.min(100, Math.round(((words - prevWords) / span) * 100)) : 100
  return { level, rank, next, toNext, pctToNext }
}

export interface LadderRung {
  milestone: Milestone
  done: boolean
  current: boolean   // the next one to reach
  pct: number        // progress toward THIS rung (only meaningful for the current one)
}

/** The full ladder, annotated for rendering (done / current / locked). */
export function ladder(words: number): LadderRung[] {
  const { next } = rankState(words)
  return MILESTONES.map((m) => {
    const done = words >= m.words
    const current = !done && next?.words === m.words
    const prev = MILESTONES.filter((x) => x.words < m.words).pop()
    const lo = prev ? prev.words : 0
    const pct = done ? 100 : Math.min(100, Math.max(0, Math.round(((words - lo) / (m.words - lo)) * 100)))
    return { milestone: m, done, current, pct }
  })
}

/**
 * The highest milestone the learner has reached but not yet celebrated, or null.
 * Celebrating the highest (and marking it) avoids a backlog of pop-ups when a
 * big sprint crosses several at once.
 */
export function newlyReached(words: number, celebrated: number): Milestone | null {
  const reached = MILESTONES.filter((m) => words >= m.words && m.words > celebrated)
  return reached.length ? reached[reached.length - 1] : null
}
