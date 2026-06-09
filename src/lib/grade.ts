import { Rating } from './fsrs/types'

/* ---------------------------------------------------------------------------
 * Active-recall grading. The learner PRODUCES the Finnish (types it); the system
 * judges it and picks the FSRS rating — no self-rating, no escape hatch. A small
 * edit-distance tolerance means a single typo or a missing ä/ö counts as a near
 * miss (comes back sooner) rather than an outright fail.
 * ------------------------------------------------------------------------- */

export type GradeTier = 'correct' | 'close' | 'wrong'
export interface Grade { tier: GradeTier; rating: Rating }

// Lowercase, NFC-normalise, drop punctuation, collapse whitespace. Keeps letters
// (incl. ä/ö/å as distinct letters — a missing ä is a 1-char edit, i.e. "close").
export function normalizeAnswer(s: string): string {
  return s.toLowerCase().normalize('NFC').replace(/[^\p{L}\s]/gu, '').replace(/\s+/g, ' ').trim()
}

// Levenshtein edit distance (iterative, two-row).
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  let curr = new Array(b.length + 1)
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    [prev, curr] = [curr, prev]
  }
  return prev[b.length]
}

/** Grade a typed answer against the expected Finnish. */
export function gradeAnswer(typed: string, answer: string): Grade {
  const a = normalizeAnswer(typed)
  const b = normalizeAnswer(answer)
  if (!a) return { tier: 'wrong', rating: Rating.Again }
  if (a === b) return { tier: 'correct', rating: Rating.Good }
  // Tolerance scales with length: ~1 char for a word, a few for a sentence.
  const tolerance = Math.max(1, Math.round(b.length * 0.12))
  if (levenshtein(a, b) <= tolerance) return { tier: 'close', rating: Rating.Hard }
  return { tier: 'wrong', rating: Rating.Again }
}
