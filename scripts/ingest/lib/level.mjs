// scripts/ingest/lib/level.mjs
//
// CEFR level banding from frequency rank. This is an explicit HEURISTIC, not a
// sourced fact: the more frequent a word, the earlier a learner meets it. The
// bands mirror the existing seed's intent (ranks 1–250 ≈ A1, 251–500 ≈ A2) and
// extend it. A curriculum designer can override per word via the topic map.

/**
 * @param {number} rank Leipzig frequency rank (1 = most frequent)
 * @returns {'A1'|'A2'|'B1'|'B2'}
 */
export function levelForRank(rank) {
  if (rank <= 250) return 'A1'
  if (rank <= 600) return 'A2'
  if (rank <= 1500) return 'B1'
  return 'B2'
}
