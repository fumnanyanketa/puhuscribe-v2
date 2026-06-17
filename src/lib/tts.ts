// Finnish text-to-speech via the Cloudflare TTS Worker (Azure fi-FI-NooraNeural).
// Kirjakieli only — the app always passes the written form (project rule:
// puhekieli is shown as text, never TTS'd).
//
// The worker URL comes from VITE_TTS_WORKER_URL (set in Vercel after the worker
// deploys). Until it is set, speak() is a no-op, so the play buttons simply
// animate without audio — nothing breaks.

const WORKER = (import.meta.env.VITE_TTS_WORKER_URL as string | undefined)?.replace(/\/+$/, '')

let current: HTMLAudioElement | null = null

export function ttsConfigured(): boolean {
  return !!WORKER
}

/** Speak Finnish (kirjakieli) text aloud. No-op if the worker isn't configured. */
export function speak(text: string): void {
  const t = text.trim()
  if (!WORKER || !t) return
  if (current) {
    current.pause()
    current = null
  }
  const audio = new Audio(`${WORKER}?text=${encodeURIComponent(t)}`)
  current = audio
  void audio.play().catch(() => {
    /* autoplay/network errors are non-fatal; the tap animation still plays */
  })
}

/* ---------------------------------------------------------------------------
 * Writing feedback — the same worker exposes POST /correct, which proxies to
 * Claude Haiku for a gentle correction. `configured` is false when the worker
 * or the ANTHROPIC secret isn't set, so the UI falls back to a model-answer
 * self-check. Never throws.
 * ------------------------------------------------------------------------- */
export interface WritingFeedback { ok: boolean; corrected?: string; comment?: string; configured: boolean }

export async function getWritingFeedback(prompt: string, text: string): Promise<WritingFeedback> {
  if (!WORKER) return { ok: false, configured: false }
  try {
    const resp = await fetch(`${WORKER}/correct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, text }),
    })
    if (!resp.ok) return { ok: false, configured: false } // 503 = secret not set
    const json = await resp.json()
    if (!json || json.configured === false) return { ok: false, configured: false }
    return { ok: !!json.ok, corrected: json.corrected, comment: json.comment, configured: true }
  } catch {
    return { ok: false, configured: false }
  }
}

/* ---------------------------------------------------------------------------
 * Conversation — the FLOW stage. The same worker exposes POST /converse, which
 * proxies to Claude for a short, real chat in Finnish, level-matched and gentle.
 * `configured` is false when the worker / ANTHROPIC secret isn't set, so the UI
 * can show a graceful "not available yet" message. Never throws.
 * ------------------------------------------------------------------------- */
export interface ChatTurn { role: 'user' | 'assistant'; content: string }
export interface ChatReply { ok: boolean; reply: string; en: string; suggestions: string[]; configured: boolean }

export async function converse(
  messages: ChatTurn[],
  opts: { level?: string; topic?: string } = {},
): Promise<ChatReply> {
  const empty: ChatReply = { ok: false, reply: '', en: '', suggestions: [], configured: false }
  if (!WORKER) return empty
  try {
    const resp = await fetch(`${WORKER}/converse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, level: opts.level ?? 'A1', topic: opts.topic ?? '' }),
    })
    if (!resp.ok) return empty // 503 = secret not set, 502 = upstream error
    const json = await resp.json()
    if (!json || json.configured === false || !json.ok) return { ...empty, configured: !!json?.configured }
    return {
      ok: true,
      reply: String(json.reply ?? ''),
      en: String(json.en ?? ''),
      suggestions: Array.isArray(json.suggestions) ? json.suggestions.map(String) : [],
      configured: true,
    }
  } catch {
    return empty
  }
}

/* ---------------------------------------------------------------------------
 * Reading — connected comprehensible input. POST /reading returns a short
 * level-matched Finnish passage + a Finnish comprehension question (English is
 * a reveal-on-demand hint). `ok`/`configured` false when unavailable; the UI
 * falls back to the sentence-based reading drill. Never throws.
 * ------------------------------------------------------------------------- */
export interface Reading {
  ok: boolean; configured: boolean
  lines: string[]; en: string
  question: string; options: string[]; answer: number
}

export async function fetchReading(level: string): Promise<Reading> {
  const empty: Reading = { ok: false, configured: false, lines: [], en: '', question: '', options: [], answer: 0 }
  if (!WORKER) return empty
  try {
    const resp = await fetch(`${WORKER}/reading`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level }),
    })
    if (!resp.ok) return empty
    const json = await resp.json()
    if (!json || json.configured === false || !json.ok) return { ...empty, configured: !!json?.configured }
    return {
      ok: true, configured: true,
      lines: Array.isArray(json.lines) ? json.lines.map(String) : [],
      en: String(json.en ?? ''),
      question: String(json.question ?? ''),
      options: Array.isArray(json.options) ? json.options.map(String) : [],
      answer: Number.isInteger(json.answer) ? json.answer : 0,
    }
  } catch {
    return empty
  }
}
