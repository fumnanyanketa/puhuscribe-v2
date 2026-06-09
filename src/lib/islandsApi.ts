// Personal Language Islands — translation client.
//
// The learner writes a sentence in English; the Worker's /island/translate route
// asks Claude for the standard-written (kirjakieli) + spoken (puhekieli) Finnish,
// then Voikko-gates the kirjakieli (the SAME bar as our seed content). A sentence
// is only `verified` once Voikko has confirmed every kirjakieli word is real
// Finnish — so we never ship hallucinated Finnish to the learner.
//
// Degrades gracefully: if the Worker isn't reachable, `configured` is false and
// the UI can let the learner save a clearly-labelled DRAFT instead of failing.

const WORKER = (import.meta.env.VITE_TTS_WORKER_URL as string | undefined)?.replace(/\/+$/, '')

export interface Translation {
  ok: boolean
  kirjakieli: string
  puhekieli: string
  verified: boolean        // true only when Voikko confirmed the kirjakieli
  invalidWords: string[]   // any kirjakieli words Voikko rejected (empty when verified)
  configured: boolean      // false when the Worker/route isn't available
}

export function islandsApiConfigured(): boolean {
  return !!WORKER
}

const EMPTY: Translation = { ok: false, kirjakieli: '', puhekieli: '', verified: false, invalidWords: [], configured: false }

export async function translateSentence(en: string): Promise<Translation> {
  const text = en.trim()
  if (!WORKER || !text) return EMPTY
  try {
    const resp = await fetch(`${WORKER}/island/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ en: text }),
    })
    if (!resp.ok) return EMPTY // 503 = the AI secret isn't set on the Worker
    const j = await resp.json()
    if (!j || j.configured === false || !j.kirjakieli) return EMPTY
    return {
      ok: true,
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
