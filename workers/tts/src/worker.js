// PuhuScribe TTS proxy (Cloudflare Worker)
// Turns Finnish text into speech via Azure Cognitive Services (fi-FI-NooraNeural).
// The Azure key lives ONLY here as a Worker secret — never in the browser, never in git.
// Kirjakieli only (project rule): the app sends the written form; puhekieli is text-only.

const VOICE = 'fi-FI-NooraNeural'
const MAX_LEN = 400

function ssml(text) {
  const esc = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  return `<speak version='1.0' xml:lang='fi-FI'><voice xml:lang='fi-FI' name='${VOICE}'>${esc}</voice></speak>`
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })

    const url = new URL(request.url)
    let text = url.searchParams.get('text') || ''
    if (request.method === 'POST') {
      try { text = (await request.json()).text || text } catch { /* ignore */ }
    }
    text = text.trim().slice(0, MAX_LEN)
    if (!text) return new Response('missing text', { status: 400, headers: CORS })

    // The kirjakieli set is finite, so cache aggressively: after the first play of a
    // sentence every later request is served from Cloudflare's edge — cheap and instant.
    const cache = caches.default
    const cacheKey = new Request(`${url.origin}/tts?text=${encodeURIComponent(text)}`)
    const cached = await cache.match(cacheKey)
    if (cached) return cached

    if (!env.AZURE_SPEECH_KEY) {
      return new Response('TTS not configured', { status: 503, headers: CORS })
    }
    const region = env.AZURE_SPEECH_REGION || 'northeurope'

    const azure = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'puhuscribe-tts',
      },
      body: ssml(text),
    })

    if (!azure.ok) {
      const detail = await azure.text().catch(() => '')
      return new Response(`azure error ${azure.status}: ${detail}`.slice(0, 300), { status: 502, headers: CORS })
    }

    const resp = new Response(await azure.arrayBuffer(), {
      headers: { ...CORS, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=2592000' },
    })
    ctx.waitUntil(cache.put(cacheKey, resp.clone()))
    return resp
  },
}
