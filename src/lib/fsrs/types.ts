export enum Rating {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4,
}

export enum State {
  New = 'new',
  Learning = 'learning',
  Review = 'review',
  Relearning = 'relearning',
}

export interface Card {
  due: Date
  stability: number
  difficulty: number
  /** Days elapsed since last_review at the moment of the last schedule() call. */
  elapsed_days: number
  /** Days (or 0 for same-day steps) scheduled at the last schedule() call. */
  scheduled_days: number
  reps: number
  lapses: number
  state: State
  last_review: Date | null
}

/** Snapshot written to review_logs on every review. */
export interface ReviewLog {
  rating: Rating
  /** State BEFORE this review. */
  state: State
  due: Date
  stability: number
  difficulty: number
  elapsed_days: number
  last_elapsed_days: number
  scheduled_days: number
  review_time: Date
}

export interface SchedulingResult {
  card: Card
  log: ReviewLog
}

export interface FSRSConfig {
  /** FSRS-5 weight vector (19 values, w[0]–w[18]). */
  w: readonly number[]
  /** Target retention rate, e.g. 0.9 for 90 %. */
  request_retention: number
  /** Hard upper bound on any scheduled interval (days). */
  maximum_interval: number
  /**
   * Durations of intra-day learning steps in minutes.
   * Again uses steps[0]; a Good review graduates the card.
   */
  learning_steps: readonly number[]
  /**
   * Durations of intra-day relearning steps in minutes.
   * Again uses steps[0]; a Good/Hard/Easy review re-graduates the card.
   */
  relearning_steps: readonly number[]
}
