/* ---------------------------------------------------------------------------
 * The learning journey — Launchpad → North Star. The app is organised into
 * clear stages, each with explicit requirements, so a learner always knows
 * where they are and what they are working toward (no vague CEFR badge).
 *
 * Stage 1 (Foundation) is the only one with live content today: build a base of
 * words + your own sentences. Grammar, B1 and B2 are the visible road ahead —
 * shown but locked — so the path from day one to YKI is legible from the start.
 * ------------------------------------------------------------------------- */

// Stage 1 requirements (owner-set goals; tune here in one place).
export const STAGE1_WORDS = 2000
export const STAGE1_SENTENCES = 1000

export interface JourneyStage {
  n: number
  fi: string
  en: string
  icon: string          // icon name from components/icons
  blurb: string         // one-line plain-English description
  cefr: string          // the rough CEFR band this stage spans
  reqWords?: number
  reqSentences?: number
  northStar?: boolean
}

export const STAGES: JourneyStage[] = [
  {
    n: 1, fi: 'Perusta', en: 'Foundation', icon: 'sprout', cefr: 'A1 to A2',
    reqWords: STAGE1_WORDS, reqSentences: STAGE1_SENTENCES,
    blurb: 'Build your base: the 2,000 most useful words, and 1,000 sentences from your own life.',
  },
  {
    n: 2, fi: 'Kielioppi', en: 'Grammar', icon: 'book', cefr: 'A2 to B1',
    blurb: 'Make it correct: how Finnish actually works — the cases, the verb types, the structure.',
  },
  {
    n: 3, fi: 'Arjen sujuvuus', en: 'Everyday fluency', icon: 'chat', cefr: 'YKI B1',
    blurb: 'Hold real conversations across all four skills. The level you need for citizenship.',
  },
  {
    n: 4, fi: 'Työelämän suomi', en: 'Professional Finnish', icon: 'star', cefr: 'YKI B2', northStar: true,
    blurb: 'Work and study in Finnish. Your North Star.',
  },
]

export interface JourneyState {
  current: number       // current stage number (1-based)
  words: number
  sentences: number
  wordPct: number       // % toward the stage-1 word goal
  sentPct: number       // % toward the stage-1 sentence goal
  overallPct: number    // overall stage-1 completion (the headline number)
  stage1Done: boolean
}

export function journeyState(words: number, sentences: number): JourneyState {
  const wordFrac = Math.min(1, words / STAGE1_WORDS)
  const sentFrac = Math.min(1, sentences / STAGE1_SENTENCES)
  const stage1Done = words >= STAGE1_WORDS && sentences >= STAGE1_SENTENCES
  // Stages 2+ aren't built yet, so the app keeps you in Stage 1 and shows the
  // rest as the locked road ahead. (When grammar ships, advance `current` here.)
  const current = stage1Done ? 2 : 1
  return {
    current,
    words, sentences,
    wordPct: Math.round(wordFrac * 100),
    sentPct: Math.round(sentFrac * 100),
    overallPct: Math.round(((wordFrac + sentFrac) / 2) * 100),
    stage1Done,
  }
}

export function stageByNumber(n: number): JourneyStage {
  return STAGES.find((s) => s.n === n) ?? STAGES[0]
}
