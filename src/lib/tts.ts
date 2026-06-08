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
