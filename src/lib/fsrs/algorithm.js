/**
 * FSRS-5 core math — pure functions, no state.
 *
 * Reference: https://github.com/open-spaced-repetition/fsrs5
 * All formulas match the FSRS-5 specification (19-parameter variant).
 */
import { Rating } from './types.js';
// ---------------------------------------------------------------------------
// Forgetting-curve constants
// ---------------------------------------------------------------------------
/** Controls the shape of the power-law forgetting curve. */
export const DECAY = -0.5;
/**
 * Scaling factor chosen so that R(t = S, S) = 0.9 exactly.
 * FACTOR = 0.9^(1/DECAY) − 1 = 0.9^(−2) − 1 ≈ 0.2346
 */
export const FACTOR = Math.pow(0.9, 1 / DECAY) - 1;
// ---------------------------------------------------------------------------
// Default FSRS-5 weight vector (w[0]–w[18])
// ---------------------------------------------------------------------------
export const DEFAULT_W = [
    0.4072, // w[0]  initial stability — Again
    1.1829, // w[1]  initial stability — Hard
    3.1262, // w[2]  initial stability — Good
    15.4722, // w[3]  initial stability — Easy
    7.2102, // w[4]  initial difficulty base
    0.5316, // w[5]  initial difficulty decay per rating step
    1.0651, // w[6]  difficulty change coefficient
    0.0589, // w[7]  mean-reversion rate toward initDifficulty(Easy)
    1.7037, // w[8]  recall-stability growth exponent (base of exp)
    0.1596, // w[9]  recall-stability decay with current stability
    1.0074, // w[10] retrievability effect on recall-stability growth
    1.8593, // w[11] lapse-stability base coefficient
    0.1074, // w[12] difficulty effect on lapse stability
    0.2661, // w[13] stability effect on lapse stability
    2.2647, // w[14] retrievability effect on lapse stability
    0.1585, // w[15] hard-penalty multiplier on the growth term
    2.7498, // w[16] easy-bonus multiplier on the growth term
    0.0446, // w[17] short-term stability growth coefficient
    0.0, // w[18] short-term stability offset
];
// ---------------------------------------------------------------------------
// Forgetting curve
// ---------------------------------------------------------------------------
/**
 * R(t, S) = (1 + FACTOR · t/S)^DECAY
 *
 * Returns the estimated probability of recall after `elapsedDays` given a
 * card whose stability is `stability` (days until 90 % recall).
 */
export function forgettingCurve(elapsedDays, stability) {
    return Math.pow(1 + FACTOR * (elapsedDays / stability), DECAY);
}
// ---------------------------------------------------------------------------
// Interval
// ---------------------------------------------------------------------------
/**
 * Days to schedule so that retrievability equals `requestedRetention`.
 * At requestedRetention = 0.9 this returns exactly `stability`.
 */
export function nextInterval(stability, requestedRetention, maximumInterval = 36500) {
    const raw = (stability / FACTOR) * (Math.pow(requestedRetention, 1 / DECAY) - 1);
    return Math.min(Math.max(Math.round(raw), 1), maximumInterval);
}
// ---------------------------------------------------------------------------
// Difficulty
// ---------------------------------------------------------------------------
/**
 * Initial difficulty for a new card based on the first rating.
 * D0(G) = w[4] − exp(w[5] · (G − 1)) + 1, clipped to [1, 10].
 */
export function initDifficulty(rating, w) {
    return clamp(w[4] - Math.exp(w[5] * (rating - 1)) + 1, 1, 10);
}
/**
 * Updated difficulty after a review.
 * Δ = −w[6] · (G − 3), then mean-reversion toward initDifficulty(Easy).
 */
export function nextDifficulty(d, rating, w) {
    const delta = -w[6] * (rating - 3);
    const shifted = d + delta;
    const easyBase = initDifficulty(Rating.Easy, w);
    return clamp(w[7] * easyBase + (1 - w[7]) * shifted, 1, 10);
}
// ---------------------------------------------------------------------------
// Stability
// ---------------------------------------------------------------------------
/** Initial stability for a new card from its first rating: w[G − 1]. */
export function initStability(rating, w) {
    return Math.max(w[rating - 1], 0.1);
}
/**
 * Short-term stability for intra-day Learning / Relearning steps.
 * S'_s = S · exp(w[17] · (G − 3 + w[18]))
 *
 * Good (G=3) with w[18]=0 → no change.
 * Easy grows slightly; Hard/Again shrink slightly.
 */
export function shortTermStability(s, rating, w) {
    return Math.max(s * Math.exp(w[17] * (rating - 3 + w[18])), 0.1);
}
/**
 * Stability after a successful recall in the Review state.
 *
 * Baseline growth term (Good):
 *   G = S · exp(w[8]) · (11 − D) · S^(−w[9]) · (exp(w[10] · (1−R)) − 1)
 * Hard: growth × w[15]   (reduces growth to ~16 %)
 * Easy: growth × w[16]   (amplifies growth ~2.75×)
 * S'_r = S + G · modifier
 */
export function nextRecallStability(d, s, r, rating, w) {
    const modifier = rating === Rating.Hard ? w[15] : rating === Rating.Easy ? w[16] : 1;
    const growth = s *
        Math.exp(w[8]) *
        (11 - d) *
        Math.pow(s, -w[9]) *
        (Math.exp(w[10] * (1 - r)) - 1);
    return Math.max(s + growth * modifier, 0.1);
}
/**
 * Stability after a lapse (Again in Review state).
 * S'_f = w[11] · D^(−w[12]) · ((S+1)^w[13] − 1) · exp(w[14] · (1−R))
 */
export function nextForgetStability(d, s, r, w) {
    return Math.max(w[11] *
        Math.pow(d, -w[12]) *
        (Math.pow(s + 1, w[13]) - 1) *
        Math.exp(w[14] * (1 - r)), 0.1);
}
// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
