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

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

// POST /correct — gentle writing feedback via Claude Haiku. Returns
// { ok, corrected, comment, configured }. configured:false when the secret is
// missing, so the app falls back to its own model-answer self-check.
async function correct(request, env) {
  if (request.method !== 'POST') return json({ ok: false }, 405)
  let prompt = '', text = ''
  try { const b = await request.json(); prompt = String(b.prompt || ''); text = String(b.text || '') } catch { /* ignore */ }
  prompt = prompt.trim().slice(0, 300)
  text = text.trim().slice(0, 400)
  if (!text) return json({ ok: false }, 400)
  if (!env.ANTHROPIC_API_KEY) return json({ ok: false, configured: false }, 503)

  const system = "You are a kind, encouraging Finnish teacher for adult beginners (CEFR A1-A2). "
    + "The learner was asked to write a Finnish sentence meaning the given English prompt. Judge their attempt and reply with ONLY a JSON object "
    + "(no markdown, no prose) with exactly these keys: "
    + '"ok" (boolean: true if their Finnish correctly and naturally conveys the meaning, allowing minor stylistic variation), '
    + '"corrected" (a correct, natural standard written Finnish / kirjakieli sentence for the meaning; if theirs is already correct, return their sentence), '
    + '"comment" (one short warm tip in English, max 18 words, no dashes). '
    + "Use only real, standard Finnish. Never invent words."
  const userMsg = `English meaning: "${prompt}"\nLearner wrote: "${text}"`

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system,
      messages: [{ role: 'user', content: userMsg }],
    }),
  })
  if (!r.ok) return json({ ok: false }, 502)

  try {
    const data = await r.json()
    let t = ((data.content && data.content[0] && data.content[0].text) || '').trim()
    t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
    const out = JSON.parse(t)
    return json({ ok: !!out.ok, corrected: out.corrected || '', comment: out.comment || '', configured: true })
  } catch {
    return json({ ok: false, configured: true })
  }
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })

    const url = new URL(request.url)
    if (url.pathname === '/correct') return correct(request, env)

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
