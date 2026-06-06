import { Rating, State, } from './types.js';
import { DEFAULT_W, forgettingCurve, initDifficulty, initStability, nextDifficulty, nextForgetStability, nextInterval, nextRecallStability, shortTermStability, } from './algorithm.js';
// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------
const DEFAULT_CONFIG = {
    w: DEFAULT_W,
    request_retention: 0.9,
    maximum_interval: 36500,
    learning_steps: [1, 10], // minutes: Again=1 min, Good graduates after 10 min
    relearning_steps: [10], // minutes: Again=10 min, Good re-graduates
};
// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------
export function createEmptyCard(now = new Date()) {
    return {
        due: now,
        stability: 0,
        difficulty: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        reps: 0,
        lapses: 0,
        state: State.New,
        last_review: null,
    };
}
// ---------------------------------------------------------------------------
// Scheduler class
// ---------------------------------------------------------------------------
export class FSRS {
    cfg;
    constructor(config = {}) {
        this.cfg = { ...DEFAULT_CONFIG, ...config };
    }
    schedule(card, rating, now = new Date()) {
        const elapsedDays = card.last_review
            ? Math.max((now.getTime() - card.last_review.getTime()) / 86_400_000, 0)
            : 0;
        // Capture pre-review state for the log
        const preState = card.state;
        const preStability = card.stability;
        const preDifficulty = card.difficulty;
        const preDue = card.due;
        const preScheduledDays = card.scheduled_days;
        let next;
        switch (card.state) {
            case State.New:
                next = this.scheduleNew(card, rating, now, elapsedDays);
                break;
            case State.Learning:
                next = this.scheduleLearning(card, rating, now, elapsedDays);
                break;
            case State.Review:
                next = this.scheduleReview(card, rating, now, elapsedDays);
                break;
            case State.Relearning:
                next = this.scheduleRelearning(card, rating, now, elapsedDays);
                break;
            default:
                throw new Error(`Unknown card state: ${String(card.state)}`);
        }
        const log = {
            rating,
            state: preState,
            due: preDue,
            stability: preStability,
            difficulty: preDifficulty,
            elapsed_days: Math.round(elapsedDays),
            last_elapsed_days: preScheduledDays,
            scheduled_days: next.scheduled_days,
            review_time: now,
        };
        return { card: next, log };
    }
    // -------------------------------------------------------------------------
    // State handlers
    // -------------------------------------------------------------------------
    scheduleNew(card, rating, now, elapsedDays) {
        const w = this.cfg.w;
        const s = initStability(rating, w);
        const d = initDifficulty(rating, w);
        if (rating === Rating.Easy) {
            // Graduate immediately to Review
            const days = nextInterval(s, this.cfg.request_retention, this.cfg.maximum_interval);
            return {
                ...card,
                stability: s,
                difficulty: d,
                state: State.Review,
                reps: card.reps + 1,
                due: addDays(now, days),
                scheduled_days: days,
                elapsed_days: Math.round(elapsedDays),
                last_review: now,
            };
        }
        // Again / Hard / Good → enter Learning with a short step
        const stepMin = rating === Rating.Again
            ? this.cfg.learning_steps[0]
            : rating === Rating.Hard
                ? Math.ceil((this.cfg.learning_steps[0] + (this.cfg.learning_steps[1] ?? this.cfg.learning_steps[0])) / 2)
                : (this.cfg.learning_steps[1] ?? this.cfg.learning_steps[0]);
        return {
            ...card,
            stability: s,
            difficulty: d,
            state: State.Learning,
            reps: card.reps + 1,
            due: addMinutes(now, stepMin),
            scheduled_days: 0,
            elapsed_days: Math.round(elapsedDays),
            last_review: now,
        };
    }
    scheduleLearning(card, rating, now, elapsedDays) {
        const w = this.cfg.w;
        const s = shortTermStability(card.stability, rating, w);
        if (rating === Rating.Again || rating === Rating.Hard) {
            // Stay in Learning with a short step
            const stepMin = rating === Rating.Again
                ? this.cfg.learning_steps[0]
                : Math.ceil((this.cfg.learning_steps[0] + (this.cfg.learning_steps[1] ?? this.cfg.learning_steps[0])) / 2);
            return {
                ...card,
                stability: s,
                state: State.Learning,
                reps: card.reps + 1,
                due: addMinutes(now, stepMin),
                scheduled_days: 0,
                elapsed_days: Math.round(elapsedDays),
                last_review: now,
            };
        }
        // Good or Easy → graduate to Review
        const days = nextInterval(s, this.cfg.request_retention, this.cfg.maximum_interval);
        return {
            ...card,
            stability: s,
            difficulty: nextDifficulty(card.difficulty, rating, w),
            state: State.Review,
            reps: card.reps + 1,
            due: addDays(now, days),
            scheduled_days: days,
            elapsed_days: Math.round(elapsedDays),
            last_review: now,
        };
    }
    scheduleReview(card, rating, now, elapsedDays) {
        const w = this.cfg.w;
        const r = card.stability > 0
            ? forgettingCurve(elapsedDays, card.stability)
            : 0;
        if (rating === Rating.Again) {
            // Lapse → Relearning
            const s = nextForgetStability(card.difficulty, card.stability, r, w);
            const stepMin = this.cfg.relearning_steps[0];
            return {
                ...card,
                stability: s,
                difficulty: nextDifficulty(card.difficulty, rating, w),
                state: State.Relearning,
                reps: card.reps + 1,
                lapses: card.lapses + 1,
                due: addMinutes(now, stepMin),
                scheduled_days: 0,
                elapsed_days: Math.round(elapsedDays),
                last_review: now,
            };
        }
        // Hard / Good / Easy → stay in Review with updated scheduling
        const s = nextRecallStability(card.difficulty, card.stability, r, rating, w);
        const d = nextDifficulty(card.difficulty, rating, w);
        const days = nextInterval(s, this.cfg.request_retention, this.cfg.maximum_interval);
        return {
            ...card,
            stability: s,
            difficulty: d,
            state: State.Review,
            reps: card.reps + 1,
            due: addDays(now, days),
            scheduled_days: days,
            elapsed_days: Math.round(elapsedDays),
            last_review: now,
        };
    }
    scheduleRelearning(card, rating, now, elapsedDays) {
        const w = this.cfg.w;
        const s = shortTermStability(card.stability, rating, w);
        if (rating === Rating.Again) {
            const stepMin = this.cfg.relearning_steps[0];
            return {
                ...card,
                stability: s,
                state: State.Relearning,
                reps: card.reps + 1,
                due: addMinutes(now, stepMin),
                scheduled_days: 0,
                elapsed_days: Math.round(elapsedDays),
                last_review: now,
            };
        }
        // Hard / Good / Easy → re-graduate to Review
        const days = nextInterval(s, this.cfg.request_retention, this.cfg.maximum_interval);
        return {
            ...card,
            stability: s,
            difficulty: nextDifficulty(card.difficulty, rating, w),
            state: State.Review,
            reps: card.reps + 1,
            due: addDays(now, days),
            scheduled_days: days,
            elapsed_days: Math.round(elapsedDays),
            last_review: now,
        };
    }
}
// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60_000);
}
function addDays(date, days) {
    return new Date(date.getTime() + days * 86_400_000);
}
