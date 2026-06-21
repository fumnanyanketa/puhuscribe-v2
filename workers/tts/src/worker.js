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

// Ask Claude to turn the learner's answer into a complete, very simple Finnish
// sentence. It gets the QUESTION for context so a fragment ("both") becomes a
// real sentence. Returns { en, kirjakieli, puhekieli } or null. `note` lets us
// nudge a correction of words Voikko rejected on a retry.
async function translateOnce(question, en, env, note) {
  const system = "You help an absolute beginner (CEFR A1) build a personal Finnish sentence. "
    + "You are given the QUESTION they answered and their ANSWER (often a rough fragment). Produce: "
    + '"en": one natural, COMPLETE, simple English sentence that captures their answer in the context of the question '
    + '(if the answer is already a full sentence keep its meaning; if it is a fragment like "both", expand it into a full sentence that answers the question). Keep it short. '
    + '"kirjakieli": that sentence in VERY SIMPLE beginner (A1) standard WRITTEN Finnish - short, the most common words, basic structure; avoid advanced vocabulary, idioms, rare cases and long clauses. '
    + '"puhekieli": the natural SPOKEN Helsinki version of the same sentence. '
    + "Use ONLY real, standard Finnish words and real inflections - never invent words or endings. "
    + (note ? `Avoid these non-words from your previous try: ${note}. ` : '')
    + 'Reply with ONLY a JSON object (no markdown) with exactly: "en", "kirjakieli", "puhekieli".'

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system,
      messages: [{ role: 'user', content: `Question: "${question}"\nTheir answer: "${en}"` }],
    }),
  })
  if (!r.ok) return null
  try {
    const data = await r.json()
    let t = ((data.content && data.content[0] && data.content[0].text) || '').trim()
    t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
    const out = JSON.parse(t)
    const kirjakieli = String(out.kirjakieli || '').trim()
    const puhekieli = String(out.puhekieli || '').trim()
    const enFull = String(out.en || '').trim() || en
    if (!kirjakieli) return null
    return { en: enFull, kirjakieli, puhekieli }
  } catch {
    return null
  }
}

// Voikko-gate the kirjakieli via the validation sidecar (same bar as seed content).
// Returns { verified, invalid }. If the service isn't configured, verified=false
// with no invalid list — the app then saves the sentence as a labelled draft.
async function voikkoValidate(kirjakieli, env) {
  if (!env.VOIKKO_SERVICE_URL) return { verified: false, invalid: [] }
  try {
    const headers = { 'Content-Type': 'application/json' }
    if (env.VOIKKO_SHARED_SECRET) headers['X-Voikko-Secret'] = env.VOIKKO_SHARED_SECRET
    const vr = await fetch(env.VOIKKO_SERVICE_URL.replace(/\/+$/, '') + '/validate', {
      method: 'POST', headers, body: JSON.stringify({ text: kirjakieli }),
    })
    if (!vr.ok) return { verified: false, invalid: [] }
    const vj = await vr.json()
    return { verified: !!vj.ok, invalid: Array.isArray(vj.invalid) ? vj.invalid : [] }
  } catch {
    return { verified: false, invalid: [] }
  }
}

// POST /island/translate — translate the learner's own English sentence to
// validated Finnish for a personal Language Island. The heart of the method:
// the learner authors; we translate + verify; nothing invented ships.
async function islandTranslate(request, env) {
  if (request.method !== 'POST') return json({ ok: false }, 405)
  let en = '', question = ''
  try { const b = await request.json(); en = String(b.en || ''); question = String(b.question || '') } catch { /* ignore */ }
  en = en.trim().slice(0, 300)
  question = question.trim().slice(0, 200)
  if (!en) return json({ ok: false }, 400)
  if (!env.ANTHROPIC_API_KEY) return json({ ok: false, configured: false }, 503)

  let t = await translateOnce(question, en, env)
  if (!t) return json({ ok: false, configured: true }, 502)

  let { verified, invalid } = await voikkoValidate(t.kirjakieli, env)
  // One corrective pass if Voikko rejected words and the service is live.
  if (!verified && invalid.length > 0) {
    const retry = await translateOnce(question, en, env, invalid.join(', '))
    if (retry) {
      const second = await voikkoValidate(retry.kirjakieli, env)
      if (second.verified) { t = retry; verified = true; invalid = [] }
      else { invalid = second.invalid }
    }
  }

  return json({ ok: true, en: t.en, kirjakieli: t.kirjakieli, puhekieli: t.puhekieli, verified, invalidWords: invalid, configured: true })
}

// POST /island/questions — the coach asks 2-3 more tailored follow-up questions
// for a topic (questions only, never the answers). Uses Haiku (cheap; this is
// simple generation). Returns { ok, questions, configured }.
async function islandQuestions(request, env) {
  if (request.method !== 'POST') return json({ ok: false }, 405)
  let topic = '', answers = []
  try { const b = await request.json(); topic = String(b.topic || ''); if (Array.isArray(b.answers)) answers = b.answers.map(String) } catch { /* ignore */ }
  topic = topic.trim().slice(0, 120)
  if (!env.ANTHROPIC_API_KEY) return json({ ok: false, configured: false }, 503)

  const said = answers.map((a) => a.trim()).filter(Boolean).slice(0, 8).join(' | ').slice(0, 600)
  const system = "You are a warm language coach helping an adult beginner build personal Finnish sentences about a topic. "
    + "Suggest 2-3 SHORT, simple follow-up QUESTIONS in English that prompt them to say more about their real life and would make easy beginner sentences. "
    + "Build on what they already said, do not repeat their points, and NEVER write the sentences for them. "
    + 'Reply with ONLY a JSON object (no markdown): {"questions": ["...", "..."]}.'
  const userMsg = `Topic: "${topic}"\nWhat they've said so far: ${said || '(nothing yet)'}`

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
    const questions = Array.isArray(out.questions) ? out.questions.map((q) => String(q).trim()).filter(Boolean).slice(0, 3) : []
    return json({ ok: true, questions, configured: true })
  } catch {
    return json({ ok: false, configured: true })
  }
}

// POST /converse — the FLOW stage: a short, real conversation IN Finnish with a
// warm AI tutor. The two rails are baked into the prompt: comprehensible input
// (replies pitched to the learner's level, mostly in Finnish) and a low
// affective filter (encouraging, errors are fine, corrections never block the
// chat). Returns { ok, reply, en, suggestions, configured }. configured:false
// when the secret is missing, so the app shows a graceful message.
async function converse(request, env) {
  if (request.method !== 'POST') return json({ ok: false }, 405)
  let messages = [], level = 'A1', topic = ''
  try {
    const b = await request.json()
    if (Array.isArray(b.messages)) messages = b.messages
    level = String(b.level || 'A1').slice(0, 4)
    topic = String(b.topic || '').trim().slice(0, 120)
  } catch { /* ignore */ }
  if (!env.ANTHROPIC_API_KEY) return json({ ok: false, configured: false }, 503)

  // Keep only the recent turns (cost + focus), and only the fields we trust.
  const turns = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 500) }))

  const system =
    `You are Otso, a warm, patient Finnish conversation partner for an adult immigrant in Finland at CEFR ${level}. `
    + 'You are having a REAL, short spoken-style conversation to help them ACQUIRE Finnish by using it. Rules:\n'
    + '1. Reply ONLY in simple, natural standard written Finnish (kirjakieli), pitched JUST above their level so it is still understandable. '
    + 'Keep it to ONE or TWO short sentences, and almost always end with a simple question so the conversation keeps going.\n'
    + '2. Be encouraging. Mistakes are completely fine. NEVER scold, never give a grammar lecture, never refuse to continue because of an error. '
    + 'Always keep the conversation flowing about the MEANING — a correction must never block the chat.\n'
    + '3. Stay grounded in their real everyday life (home, work, the shop, the tram, family, hobbies).\n'
    + '4. Use ONLY real, standard Finnish words and real inflections. Never invent words.\n'
    + '5. GENTLE CORRECTION: if the learner\'s most recent message has a MEANINGFUL Finnish mistake (a wrong word, a wrong form/ending, or a clearly wrong structure a teacher would fix), '
    + 'include a short correction of THEIR message. IGNORE tiny things: typos, missing capital letters, missing final punctuation, and natural spoken (puhekieli) forms. '
    + 'If their Finnish is fine, or they wrote in English, or it is the very first turn, set correction to null. Do NOT correct more than one thing; pick the most useful.\n'
    + (topic ? `The learner wants to talk about: "${topic}".\n` : '')
    + 'If there are no messages yet, greet them warmly in Finnish and ask one easy opening question.\n'
    + 'Reply with ONLY a JSON object (no markdown) with exactly these keys: '
    + '"reply" (your Finnish message), '
    + '"en" (a plain English translation of your Finnish message, so a stuck beginner can check meaning), '
    + '"suggestions" (an array of 1 to 3 VERY short, simple Finnish replies the learner could tap to answer you — real beginner Finnish, each a few words), '
    + '"correction" (either null, OR an object {"better": "<their last message rewritten in correct, natural Finnish>", "note": "<one short, warm tip in English explaining the fix, max 16 words, no dashes>"}).'

  const apiMessages = turns.length > 0 ? turns : [{ role: 'user', content: '(aloita keskustelu)' }]

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 350,
      system,
      messages: apiMessages,
    }),
  })
  if (!r.ok) return json({ ok: false }, 502)
  try {
    const data = await r.json()
    let t = ((data.content && data.content[0] && data.content[0].text) || '').trim()
    t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
    const out = JSON.parse(t)
    const reply = String(out.reply || '').trim()
    const en = String(out.en || '').trim()
    const suggestions = Array.isArray(out.suggestions)
      ? out.suggestions.map((s) => String(s).trim()).filter(Boolean).slice(0, 3)
      : []
    // Optional gentle correction of the learner's last message (never blocks).
    let correction = null
    if (out.correction && typeof out.correction === 'object') {
      const better = String(out.correction.better || '').trim()
      const note = String(out.correction.note || '').trim()
      if (better) correction = { better, note }
    }
    if (!reply) return json({ ok: false, configured: true }, 502)
    return json({ ok: true, reply, en, suggestions, correction, configured: true })
  } catch {
    return json({ ok: false, configured: true }, 502)
  }
}

// POST /reading — Rail 1, connected comprehensible input: a SHORT everyday
// Finnish passage pitched to the learner's level, with a comprehension question
// IN FINNISH (English is only a reveal-on-demand hint, not the task). Returns
// { ok, lines, en, question, options, answer, configured }.
async function reading(request, env) {
  if (request.method !== 'POST') return json({ ok: false }, 405)
  let level = 'A1'
  try { const b = await request.json(); level = String(b.level || 'A1').slice(0, 4) } catch { /* ignore */ }
  if (!env.ANTHROPIC_API_KEY) return json({ ok: false, configured: false }, 503)

  const system =
    `Write a VERY SHORT everyday Finnish reading passage for an adult immigrant at CEFR ${level}. Rules:\n`
    + '1. 2 to 4 short, simple sentences about ordinary daily life (home, work, the shop, the bus, family, weather). '
    + 'Pitch it JUST above the level so it stretches slightly but stays understandable. Use ONLY real, standard written Finnish (kirjakieli); never invent words.\n'
    + '2. Then ONE simple comprehension question ABOUT the passage, written IN FINNISH, with exactly 3 short answer options IN FINNISH (only one correct).\n'
    + 'Reply with ONLY a JSON object (no markdown) with exactly: '
    + '"lines" (array of the passage sentences, each a string), '
    + '"en" (a plain English translation of the whole passage), '
    + '"question" (the Finnish comprehension question), '
    + '"options" (array of exactly 3 Finnish strings), '
    + '"answer" (the 0-based index of the correct option).'

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system,
      messages: [{ role: 'user', content: `Write one passage and question for level ${level}.` }],
    }),
  })
  if (!r.ok) return json({ ok: false }, 502)
  try {
    const data = await r.json()
    let t = ((data.content && data.content[0] && data.content[0].text) || '').trim()
    t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
    const out = JSON.parse(t)
    const lines = Array.isArray(out.lines) ? out.lines.map((l) => String(l).trim()).filter(Boolean).slice(0, 5) : []
    const options = Array.isArray(out.options) ? out.options.map((o) => String(o).trim()).filter(Boolean).slice(0, 3) : []
    const answer = Number.isInteger(out.answer) ? out.answer : 0
    const question = String(out.question || '').trim()
    const en = String(out.en || '').trim()
    if (lines.length === 0 || options.length !== 3 || !question) return json({ ok: false, configured: true }, 502)
    return json({ ok: true, lines, en, question, options, answer: Math.max(0, Math.min(2, answer)), configured: true })
  } catch {
    return json({ ok: false, configured: true }, 502)
  }
}

// POST /feedback — email a beta tester's note to the owner (in addition to the
// row the app stores in Supabase). Uses Resend. configured:false when the
// secrets are missing, so the app's send still succeeds silently and the note
// is never lost (it is already saved to Supabase + a local backup).
const MOODS = { 1: '😕 Needs work', 2: '🙂 Okay', 3: '😍 Love it' }

async function feedback(request, env) {
  if (request.method !== 'POST') return json({ ok: false }, 405)
  let message = '', rating = null, screen = '', userId = '', userAgent = ''
  try {
    const b = await request.json()
    message = String(b.message || '').trim().slice(0, 2000)
    rating = (b.rating === 1 || b.rating === 2 || b.rating === 3) ? b.rating : null
    screen = String(b.screen || '').trim().slice(0, 60)
    userId = String(b.userId || '').trim().slice(0, 80)
    userAgent = String(b.userAgent || '').trim().slice(0, 300)
  } catch { /* ignore malformed body */ }
  if (!message) return json({ ok: false }, 400)
  if (!env.RESEND_API_KEY || !env.FEEDBACK_EMAIL_TO) return json({ ok: false, configured: false }, 503)

  const mood = rating ? MOODS[rating] : '(no mood)'
  const from = env.FEEDBACK_EMAIL_FROM || 'PuhuScribe <onboarding@resend.dev>'
  const subject = rating ? `PuhuScribe feedback (${MOODS[rating]})` : 'PuhuScribe feedback'
  const body = [
    `Mood: ${mood}`,
    screen ? `Screen: ${screen}` : null,
    '',
    message,
    '',
    userId ? `User: ${userId}` : 'User: (signed out)',
    userAgent ? `Device: ${userAgent}` : null,
    `At: ${new Date().toISOString()}`,
  ].filter((l) => l !== null).join('\n')

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [env.FEEDBACK_EMAIL_TO], subject, text: body }),
  })
  if (!r.ok) {
    const detail = await r.text().catch(() => '')
    return json({ ok: false, configured: true, detail: detail.slice(0, 200) }, 502)
  }
  return json({ ok: true, configured: true })
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })

    const url = new URL(request.url)
    if (url.pathname === '/correct') return correct(request, env)
    if (url.pathname === '/island/translate') return islandTranslate(request, env)
    if (url.pathname === '/island/questions') return islandQuestions(request, env)
    if (url.pathname === '/converse') return converse(request, env)
    if (url.pathname === '/reading') return reading(request, env)
    if (url.pathname === '/feedback') return feedback(request, env)

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
