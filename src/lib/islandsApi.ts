// Personal Language Islands — translation client.
//
// The learner answers a question in rough English; the Worker's /island/translate
// route asks Claude to turn it into a COMPLETE, very simple (CEFR A1) Finnish
// sentence — written (kirjakieli) + spoken (puhekieli) — and returns the full
// English too (so a fragment like "both" becomes a real, learnable sentence).
// The kirjakieli is then Voikko-gated (the SAME bar as our seed content); a
// sentence is only `verified` once Voikko confirms every word is real Finnish.
//
// Degrades gracefully: if the Worker isn't reachable, `configured` is false and
// the UI can let the learner save a clearly-labelled DRAFT instead of failing.

const WORKER = (import.meta.env.VITE_TTS_WORKER_URL as string | undefined)?.replace(/\/+$/, '')

export interface Translation {
  ok: boolean
  en: string               // the completed, full English sentence (may expand a fragment)
  kirjakieli: string
  puhekieli: string
  verified: boolean        // true only when Voikko confirmed the kirjakieli
  invalidWords: string[]   // any kirjakieli words Voikko rejected (empty when verified)
  configured: boolean      // false when the Worker/route isn't available
}

export function islandsApiConfigured(): boolean {
  return !!WORKER
}

const EMPTY: Translation = { ok: false, en: '', kirjakieli: '', puhekieli: '', verified: false, invalidWords: [], configured: false }

/** Translate one answer. `question` gives the model context to complete a fragment. */
export async function translateSentence(question: string, en: string): Promise<Translation> {
  const text = en.trim()
  if (!WORKER || !text) return EMPTY
  try {
    const resp = await fetch(`${WORKER}/island/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: question.trim(), en: text }),
    })
    if (!resp.ok) return EMPTY // 503 = the AI secret isn't set on the Worker
    const j = await resp.json()
    if (!j || j.configured === false || !j.kirjakieli) return EMPTY
    return {
      ok: true,
      en: String(j.en || text),
      kirjakieli: String(j.kirjakieli),
      puhekieli: String(j.puhekieli ?? ''),
      verified: !!j.verified,
      invalidWords: Array.isArray(j.invalidWords) ? j.invalidWords.map(String) : [],
      configured: true,
    }
  } catch {
    return EMPTY
  }
}

/**
 * The coach's follow-up questions for a topic — 2-3 more, tailored to what the
 * learner has already said. Questions only (the learner still authors the
 * answers). Returns [] if the Worker isn't available.
 */
export async function fetchFollowupQuestions(topic: string, answers: string[]): Promise<string[]> {
  if (!WORKER) return []
  try {
    const resp = await fetch(`${WORKER}/island/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, answers }),
    })
    if (!resp.ok) return []
    const j = await resp.json()
    return Array.isArray(j?.questions) ? j.questions.map((q: unknown) => String(q)) : []
  } catch {
    return []
  }
}
