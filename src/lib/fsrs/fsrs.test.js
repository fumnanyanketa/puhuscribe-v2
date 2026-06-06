import { describe, expect, it, beforeEach } from 'vitest';
import { Rating, State } from './types.js';
import { DEFAULT_W, forgettingCurve, nextInterval } from './algorithm.js';
import { createEmptyCard, FSRS } from './scheduler.js';
const MS_PER_MIN = 60_000;
const MS_PER_DAY = 86_400_000;
// Fixed reference time — all tests run from the same "now"
const NOW = new Date('2026-06-03T10:00:00.000Z');
describe('FSRS-5 scheduler', () => {
    let fsrs;
    beforeEach(() => {
        fsrs = new FSRS();
    });
    // -------------------------------------------------------------------------
    // New card — first review
    // -------------------------------------------------------------------------
    it('New → Again: enters Learning, stability ≈ w[0], due in ~1 min', () => {
        const card = createEmptyCard(NOW);
        const { card: next, log } = fsrs.schedule(card, Rating.Again, NOW);
        expect(next.state).toBe(State.Learning);
        expect(next.stability).toBeCloseTo(DEFAULT_W[0], 2); // ≈ 0.4072
        expect(next.difficulty).toBeCloseTo(DEFAULT_W[4] - Math.exp(DEFAULT_W[5] * 0) + 1, 2);
        expect(next.reps).toBe(1);
        expect(next.lapses).toBe(0);
        const dueOffsetMs = next.due.getTime() - NOW.getTime();
        expect(dueOffsetMs).toBeGreaterThanOrEqual(MS_PER_MIN * 0.9);
        expect(dueOffsetMs).toBeLessThanOrEqual(MS_PER_MIN * 1.1);
        expect(log.state).toBe(State.New);
        expect(log.rating).toBe(Rating.Again);
    });
    it('New → Good: enters Learning, stability ≈ w[2], due in ~10 min', () => {
        const card = createEmptyCard(NOW);
        const { card: next } = fsrs.schedule(card, Rating.Good, NOW);
        expect(next.state).toBe(State.Learning);
        expect(next.stability).toBeCloseTo(DEFAULT_W[2], 2); // ≈ 3.1262
        const dueOffsetMs = next.due.getTime() - NOW.getTime();
        expect(dueOffsetMs).toBeGreaterThanOrEqual(MS_PER_MIN * 9);
        expect(dueOffsetMs).toBeLessThanOrEqual(MS_PER_MIN * 11);
    });
    it('New → Easy: graduates straight to Review, interval ≈ 15 days', () => {
        const card = createEmptyCard(NOW);
        const { card: next } = fsrs.schedule(card, Rating.Easy, NOW);
        expect(next.state).toBe(State.Review);
        expect(next.stability).toBeCloseTo(DEFAULT_W[3], 2); // ≈ 15.4722
        expect(next.scheduled_days).toBeGreaterThanOrEqual(14);
        expect(next.scheduled_days).toBeLessThanOrEqual(16);
    });
    // -------------------------------------------------------------------------
    // Learning → graduation
    // -------------------------------------------------------------------------
    it('Learning → Good: graduates to Review, scheduled_days ≥ 1', () => {
        const card = createEmptyCard(NOW);
        const learningCard = fsrs.schedule(card, Rating.Good, NOW).card;
        expect(learningCard.state).toBe(State.Learning);
        // Review 10 minutes later
        const reviewTime = new Date(NOW.getTime() + 10 * MS_PER_MIN);
        const { card: next } = fsrs.schedule(learningCard, Rating.Good, reviewTime);
        expect(next.state).toBe(State.Review);
        expect(next.scheduled_days).toBeGreaterThanOrEqual(1);
        expect(next.stability).toBeGreaterThan(0);
    });
    it('Learning → Again: stays in Learning, due in ~1 min', () => {
        const card = createEmptyCard(NOW);
        const learningCard = fsrs.schedule(card, Rating.Good, NOW).card;
        const reviewTime = new Date(NOW.getTime() + 10 * MS_PER_MIN);
        const { card: next } = fsrs.schedule(learningCard, Rating.Again, reviewTime);
        expect(next.state).toBe(State.Learning);
        const dueOffsetMs = next.due.getTime() - reviewTime.getTime();
        expect(dueOffsetMs).toBeGreaterThan(0);
        expect(dueOffsetMs).toBeLessThanOrEqual(2 * MS_PER_MIN);
    });
    // -------------------------------------------------------------------------
    // Review state
    // -------------------------------------------------------------------------
    it('Review → Good: stability grows, scheduled_days increases', () => {
        // Simulate a card reviewed at Good when stability=10, reviewed after 10 days
        const reviewCard = makeReviewCard(10, 5, 10, NOW);
        const { card: next } = fsrs.schedule(reviewCard, Rating.Good, NOW);
        expect(next.state).toBe(State.Review);
        expect(next.stability).toBeGreaterThan(10); // must grow
        expect(next.scheduled_days).toBeGreaterThan(10);
    });
    it('Review → Hard gives a shorter interval than Review → Good', () => {
        const reviewCard = makeReviewCard(10, 5, 10, NOW);
        const { card: hard } = fsrs.schedule(reviewCard, Rating.Hard, NOW);
        const { card: good } = fsrs.schedule(reviewCard, Rating.Good, NOW);
        expect(hard.scheduled_days).toBeLessThan(good.scheduled_days);
    });
    it('Review → Easy gives a longer interval than Review → Good', () => {
        const reviewCard = makeReviewCard(10, 5, 10, NOW);
        const { card: easy } = fsrs.schedule(reviewCard, Rating.Easy, NOW);
        const { card: good } = fsrs.schedule(reviewCard, Rating.Good, NOW);
        expect(easy.scheduled_days).toBeGreaterThan(good.scheduled_days);
    });
    it('Review → Again: lapses, enters Relearning, due in ~10 min', () => {
        const reviewCard = makeReviewCard(10, 5, 10, NOW);
        const { card: next } = fsrs.schedule(reviewCard, Rating.Again, NOW);
        expect(next.state).toBe(State.Relearning);
        expect(next.lapses).toBe(reviewCard.lapses + 1);
        // Stability must drop below pre-lapse value
        expect(next.stability).toBeLessThan(reviewCard.stability);
        const dueOffsetMs = next.due.getTime() - NOW.getTime();
        expect(dueOffsetMs).toBeGreaterThan(0);
        expect(dueOffsetMs).toBeLessThanOrEqual(15 * MS_PER_MIN);
    });
    // -------------------------------------------------------------------------
    // Relearning → re-graduation
    // -------------------------------------------------------------------------
    it('Relearning → Good: re-graduates to Review', () => {
        const reviewCard = makeReviewCard(10, 5, 10, NOW);
        const relearningCard = fsrs.schedule(reviewCard, Rating.Again, NOW).card;
        expect(relearningCard.state).toBe(State.Relearning);
        const laterTime = new Date(NOW.getTime() + 10 * MS_PER_MIN);
        const { card: next } = fsrs.schedule(relearningCard, Rating.Good, laterTime);
        expect(next.state).toBe(State.Review);
        expect(next.scheduled_days).toBeGreaterThanOrEqual(1);
    });
    // -------------------------------------------------------------------------
    // Invariants
    // -------------------------------------------------------------------------
    it('Difficulty stays within [1, 10] after 20 consecutive Again reviews', () => {
        let card = createEmptyCard(NOW);
        let now = NOW;
        for (let i = 0; i < 20; i++) {
            ;
            ({ card } = fsrs.schedule(card, Rating.Again, now));
            now = new Date(now.getTime() + MS_PER_MIN);
            expect(card.difficulty).toBeGreaterThanOrEqual(1);
            expect(card.difficulty).toBeLessThanOrEqual(10);
        }
    });
    it('Difficulty decreases after an Easy review', () => {
        // Start with a high-difficulty review card
        const highD = makeReviewCard(10, 8, 10, NOW);
        const { card: next } = fsrs.schedule(highD, Rating.Easy, NOW);
        expect(next.difficulty).toBeLessThan(highD.difficulty);
    });
    it('Stability is always positive after any review sequence', () => {
        const ratings = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];
        const states = [State.New, State.Learning, State.Review, State.Relearning];
        for (const state of states) {
            for (const rating of ratings) {
                let card;
                if (state === State.New)
                    card = createEmptyCard(NOW);
                else if (state === State.Learning)
                    card = fsrs.schedule(createEmptyCard(NOW), Rating.Good, NOW).card;
                else if (state === State.Review)
                    card = makeReviewCard(5, 5, 5, NOW);
                else {
                    const base = makeReviewCard(5, 5, 5, NOW);
                    card = fsrs.schedule(base, Rating.Again, NOW).card;
                }
                const { card: next } = fsrs.schedule(card, rating, new Date(card.due.getTime()));
                expect(next.stability).toBeGreaterThan(0);
            }
        }
    });
    // -------------------------------------------------------------------------
    // Algorithm primitives
    // -------------------------------------------------------------------------
    it('forgettingCurve: R(t=S, S) ≈ 0.9', () => {
        const S = 21;
        expect(forgettingCurve(S, S)).toBeCloseTo(0.9, 4);
    });
    it('nextInterval: interval(S, r=0.9) = S exactly (by definition)', () => {
        expect(nextInterval(15, 0.9)).toBe(15);
        expect(nextInterval(30, 0.9)).toBe(30);
        expect(nextInterval(100, 0.9)).toBe(100);
    });
    it('nextInterval: higher retention → longer interval', () => {
        // Counterintuitive: higher retention target means more frequent reviews
        expect(nextInterval(30, 0.95)).toBeLessThan(nextInterval(30, 0.9));
    });
});
// ---------------------------------------------------------------------------
// Test fixture helpers
// ---------------------------------------------------------------------------
function makeReviewCard(stabilityDays, difficulty, elapsedDays, now) {
    const lastReview = new Date(now.getTime() - elapsedDays * MS_PER_DAY);
    return {
        due: lastReview,
        stability: stabilityDays,
        difficulty,
        elapsed_days: elapsedDays,
        scheduled_days: elapsedDays,
        reps: 5,
        lapses: 0,
        state: State.Review,
        last_review: lastReview,
    };
}
