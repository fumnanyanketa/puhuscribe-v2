import { fetchVocabSession, VocabCard } from './cards'
import { fetchDueIslandRecall, IslandRecallCard } from './islands'

/* ---------------------------------------------------------------------------
 * The daily review queue — one spaced-repetition loop over everything the
 * learner has met: vocabulary (Day One + daily intake) AND their own personal
 * island sentences once those come back around. Both are real FSRS cards, so
 * rateCard()/previewIntervals() work on either.
 * ------------------------------------------------------------------------- */

export type ReviewItem =
  | { kind: 'word'; card: VocabCard }
  | { kind: 'island'; card: IslandRecallCard }

/**
 * Build the session: due personal island sentences first (they're the learner's
 * own words — highest value), then due/new vocabulary filling the rest. Capped
 * to `size` so a big island doesn't crowd out everything else in one sitting.
 */
export async function fetchDailyReview(userId: string, size: number): Promise<ReviewItem[]> {
  const dueIslands = await fetchDueIslandRecall(userId, size)
  const wordBudget = Math.max(0, size - dueIslands.length)
  const words = wordBudget > 0 ? await fetchVocabSession(userId, wordBudget) : []

  const items: ReviewItem[] = [
    ...dueIslands.map((card): ReviewItem => ({ kind: 'island', card })),
    ...words.map((card): ReviewItem => ({ kind: 'word', card })),
  ]
  return items.slice(0, size)
}
