/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Screenshot-harness stand-in for src/lib/supabase/client.ts.
 *
 * This container cannot reach Supabase, so the real app would only ever render
 * loading / error panes. The Vite shots config (vite.shots.config.ts) redirects
 * every `../supabase/client` import to THIS module, giving a fake client that
 * serves curated fixture rows. ALL of the app's real logic (auth provider,
 * progress provider, every fetch/transform/aggregation) runs unchanged on top
 * of it, so the screens look exactly like production — only the data is sample
 * data. Not bundled into the real app; used solely by `npm run shots`.
 */

const USER = { id: 'demo-user', email: 'maria@example.com' }

const nowMs = Date.now()
const iso = (msFromNow: number) => new Date(nowMs + msFromNow).toISOString()
const DAY = 86_400_000

/* ------------------------------ words --------------------------------- */
// Real high-frequency Finnish lemmas with real IPA (kaikki.org / Wiktionary).
const WORDS = [
  { id: 1,  base_form: 'olla',   translation_en: 'to be',         ipa: '/ˈolːɑ/' },
  { id: 2,  base_form: 'ja',     translation_en: 'and',           ipa: '/ˈjɑ/' },
  { id: 3,  base_form: 'ei',     translation_en: 'no, not',       ipa: '/ˈei/' },
  { id: 4,  base_form: 'minä',   translation_en: 'I, me',         ipa: '/ˈminæ/' },
  { id: 5,  base_form: 'hyvä',   translation_en: 'good',          ipa: '/ˈhyʋæ/' },
  { id: 6,  base_form: 'kiitos', translation_en: 'thank you',     ipa: '/ˈkiːtos/' },
  { id: 7,  base_form: 'terve',  translation_en: 'hello',         ipa: '/ˈterʋe/' },
  { id: 8,  base_form: 'talo',   translation_en: 'house',         ipa: '/ˈtɑlo/' },
  { id: 9,  base_form: 'vesi',   translation_en: 'water',         ipa: '/ˈʋesi/' },
  { id: 10, base_form: 'nainen', translation_en: 'woman',         ipa: '/ˈnɑinen/' },
  { id: 11, base_form: 'mies',   translation_en: 'man',           ipa: '/ˈmies/' },
  { id: 12, base_form: 'päivä',  translation_en: 'day',           ipa: '/ˈpæiʋæ/' },
  { id: 13, base_form: 'työ',    translation_en: 'work',          ipa: '/ˈtyø/' },
  { id: 14, base_form: 'koti',   translation_en: 'home',          ipa: '/ˈkoti/' },
  { id: 15, base_form: 'raha',   translation_en: 'money',         ipa: '/ˈrɑhɑ/' },
  { id: 16, base_form: 'kello',  translation_en: 'clock, o’clock', ipa: '/ˈkelːo/' },
].map((w, i) => ({ ...w, frequency_rank: i + 1 }))

/* ----------------------------- topics --------------------------------- */
const TOPICS = [
  { id: 1, slug: 'arki',     name_fi: 'Arki',  name_en: 'Everyday',  sort_order: 1 },
  { id: 2, slug: 'tervehdys', name_fi: 'Tervehdys', name_en: 'Greetings', sort_order: 2 },
]

/* ---------------------------- sentences ------------------------------- */
// Dual-register A1/A2 survival sentences (topic 'arki'). puhekieli is the real
// spoken transform so the register diff highlights correctly.
const SENTENCES = [
  { kirjakieli: 'Minä olen kotona.',           puhekieli: 'Mä oon kotona.',        translation_en: 'I am at home.',            level: 'A1' },
  { kirjakieli: 'Mikä sinun nimesi on?',       puhekieli: 'Mikä sun nimi on?',     translation_en: 'What is your name?',       level: 'A1' },
  { kirjakieli: 'Minun nimeni on Maria.',      puhekieli: 'Mun nimi on Maria.',    translation_en: 'My name is Maria.',        level: 'A1' },
  { kirjakieli: 'Hauska tutustua.',            puhekieli: 'Hauska tutustua.',      translation_en: 'Nice to meet you.',        level: 'A1' },
  { kirjakieli: 'En ymmärrä.',                 puhekieli: 'En ymmärrä.',           translation_en: "I don't understand.",      level: 'A1' },
  { kirjakieli: 'Kiitos paljon.',              puhekieli: 'Kiitos paljon.',        translation_en: 'Thank you very much.',     level: 'A1' },
  { kirjakieli: 'Puhutko englantia?',          puhekieli: 'Puhuksä englantia?',    translation_en: 'Do you speak English?',    level: 'A2' },
  { kirjakieli: 'Voitko auttaa minua?',        puhekieli: 'Voiksä auttaa mua?',    translation_en: 'Can you help me?',         level: 'A2' },
  { kirjakieli: 'Paljonko tämä maksaa?',       puhekieli: 'Paljonko tää maksaa?',  translation_en: 'How much does this cost?', level: 'A2' },
  { kirjakieli: 'Anteeksi, missä on asema?',   puhekieli: 'Anteeks, mis on asema?', translation_en: 'Excuse me, where is the station?', level: 'A2' },
  { kirjakieli: 'Haluan oppia suomea.',        puhekieli: 'Mä haluun oppia suomee.', translation_en: 'I want to learn Finnish.', level: 'A2' },
  { kirjakieli: 'Mihin aikaan kauppa aukeaa?', puhekieli: 'Mihin aikaan kauppa aukee?', translation_en: 'What time does the shop open?', level: 'A2' },
].map((s, i) => ({ id: i + 1, topic_id: 1, ...s }))

/* ------------------------------ cards --------------------------------- */
// 60 word_production cards: 22 in review, 8 learning, 30 new. 7 review/learning
// cards are due now (the vocab "due" count + session); 8 review cards carry a
// recent last_review (the "recently reviewed" list + streak source).
const CARDS: any[] = []
let due7 = 0
let recent8 = 0
for (let n = 0; n < 60; n++) {
  const state = n < 22 ? 'review' : n < 30 ? 'learning' : 'new'
  const wordId = (n % WORDS.length) + 1
  let due: string
  let lastReview: string | null = null
  if (state === 'new') {
    due = iso(-60_000) // due now
  } else if (due7 < 7) {
    due = iso(-2 * 3600_000) // due now (review/learning)
    due7++
  } else {
    due = iso(3 * DAY) // scheduled ahead
  }
  if (state === 'review' && recent8 < 8) {
    lastReview = iso(-recent8 * 3600_000 - 1800_000) // staggered, most-recent first
    recent8++
  }
  CARDS.push({
    id: `c${n + 1}`, user_id: USER.id, card_type: 'word_production', word_id: wordId,
    state, due, last_review: lastReview,
    stability: state === 'review' ? 12 + (n % 9) : 1.5, difficulty: 5 + (n % 4),
    reps: state === 'review' ? 3 + (n % 4) : state === 'learning' ? 1 : 0, lapses: n % 2,
    scheduled_days: state === 'review' ? 3 + (n % 7) : 0, elapsed_days: state === 'review' ? 4 : 0,
  })
}

/* ------------------------- user islands ------------------------------- */
const USER_ISLANDS = [
  { id: 'isl1', user_id: USER.id, title: 'About me', topic_slug: 'about-me', created_at: iso(-3 * DAY) },
  { id: 'isl2', user_id: USER.id, title: 'My work',  topic_slug: 'work',     created_at: iso(-1 * DAY) },
]

// 12 authored island sentences (sentBank = 12). isl1 gets 7, isl2 gets 5.
const ISLAND_SENTENCE_SEED = [
  { island_id: 'isl1', en: 'My name is Maria and I am from Nigeria.', kirjakieli: 'Minun nimeni on Maria ja olen Nigeriasta.', puhekieli: 'Mun nimi on Maria ja oon Nigeriasta.' },
  { island_id: 'isl1', en: 'I live in Espoo with my family.',         kirjakieli: 'Asun Espoossa perheeni kanssa.',          puhekieli: 'Asun Espoossa perheen kaa.' },
  { island_id: 'isl1', en: 'I came to Finland for work.',             kirjakieli: 'Tulin Suomeen töiden takia.',             puhekieli: 'Tulin Suomeen duunin takii.' },
  { island_id: 'isl1', en: 'I am a nurse.',                           kirjakieli: 'Olen sairaanhoitaja.',                    puhekieli: 'Oon sairaanhoitaja.' },
  { island_id: 'isl1', en: 'I speak English and a little Finnish.',   kirjakieli: 'Puhun englantia ja vähän suomea.',        puhekieli: 'Puhun englantii ja vähän suomee.' },
  { island_id: 'isl1', en: 'I want to learn Finnish and find a job.', kirjakieli: 'Haluan oppia suomea ja löytää työn.',     puhekieli: 'Mä haluun oppia suomee ja löytää duunin.' },
  { island_id: 'isl1', en: 'I have two children.',                    kirjakieli: 'Minulla on kaksi lasta.',                 puhekieli: 'Mul on kaks lasta.' },
  { island_id: 'isl2', en: 'I am a cook and I work in a restaurant.', kirjakieli: 'Olen kokki ja työskentelen ravintolassa.', puhekieli: 'Oon kokki ja duunaan ravintolas.' },
  { island_id: 'isl2', en: 'I make food and I help customers.',       kirjakieli: 'Teen ruokaa ja autan asiakkaita.',        puhekieli: 'Teen ruokaa ja autan asiakkait.' },
  { island_id: 'isl2', en: 'I like my coworkers.',                    kirjakieli: 'Pidän työkavereistani.',                  puhekieli: 'Tykkään duunikavereista.' },
  { island_id: 'isl2', en: 'The days are long.',                      kirjakieli: 'Päivät ovat pitkiä.',                     puhekieli: 'Päivät on pitkii.' },
  { island_id: 'isl2', en: 'I want to work in a hospital.',           kirjakieli: 'Haluan työskennellä sairaalassa.',        puhekieli: 'Mä haluun duunaa sairaalas.' },
]
const USER_ISLAND_SENTENCES = ISLAND_SENTENCE_SEED.map((s, i) => ({
  id: `is${i + 1}`, user_id: USER.id, sort_order: i, verified: true, ...s,
}))

// island_recall cards: one per authored sentence; 5 due now (the sentence "due"
// count + session), the rest scheduled ahead.
const ISLAND_CARDS = USER_ISLAND_SENTENCES.map((s, i) => ({
  id: `ic${i + 1}`, user_id: USER.id, card_type: 'island_recall', island_sentence_id: s.id,
  state: i < 5 ? 'new' : 'review', due: i < 5 ? iso(-30_000) : iso(2 * DAY),
  stability: i < 5 ? 0 : 9, difficulty: 5, reps: i < 5 ? 0 : 2, lapses: 0,
  scheduled_days: i < 5 ? 0 : 2, elapsed_days: 0, last_review: i < 5 ? null : iso(-2 * DAY),
}))

CARDS.push(...ISLAND_CARDS)

/* ----------------------------- review_logs ---------------------------- */
// ~6 reviews/day for the last 5 days → a 5-day streak + a populated weekly chart.
const REVIEW_LOGS: any[] = []
for (let d = 0; d < 5; d++) {
  const count = [8, 5, 11, 6, 9][d]
  for (let k = 0; k < count; k++) {
    REVIEW_LOGS.push({
      id: `rl${d}_${k}`, user_id: USER.id, card_id: `c${(k % 60) + 1}`, rating: 3,
      review_time: iso(-d * DAY - k * 600_000 - 3600_000),
      state_before: 'review', stability_before: 8, difficulty_before: 5, elapsed_days: 1, scheduled_days: 3,
    })
  }
}

const USERS = [{ id: USER.id, email: USER.email, progress: { onboarded: true, sprint: { size: 16, idx: 16, completed: true } } }]

const TABLES: Record<string, any[]> = {
  words: WORDS,
  topics: TOPICS,
  sentences: SENTENCES,
  cards: CARDS,
  review_logs: REVIEW_LOGS,
  user_islands: USER_ISLANDS,
  user_island_sentences: USER_ISLAND_SENTENCES,
  users: USERS,
}

/* ---------------------------------------------------------------------- */
/* A tiny filter-honouring, thenable query builder over the fixtures.      */
/* ---------------------------------------------------------------------- */
type Filter = { op: string; col: string; val: any }

class Builder {
  private filters: Filter[] = []
  private orderCol: string | null = null
  private orderAsc = true
  private limitN: number | null = null
  private singleMode: 'single' | 'maybe' | null = null
  private head = false
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select'
  private payload: any = null

  constructor(private table: string) {}

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (opts?.head) this.head = true
    return this
  }
  insert(payload: any) { this.op = 'insert'; this.payload = payload; return this }
  update(payload: any) { this.op = 'update'; this.payload = payload; return this }
  upsert(payload: any) { this.op = 'upsert'; this.payload = payload; return this }
  delete() { this.op = 'delete'; return this }

  eq(col: string, val: any) { this.filters.push({ op: 'eq', col, val }); return this }
  neq(col: string, val: any) { this.filters.push({ op: 'neq', col, val }); return this }
  in(col: string, val: any[]) { this.filters.push({ op: 'in', col, val }); return this }
  is(col: string, val: any) { this.filters.push({ op: 'is', col, val }); return this }
  not(col: string, _opIs: string, val: any) { this.filters.push({ op: 'not-is', col, val }); return this }
  gte(col: string, val: any) { this.filters.push({ op: 'gte', col, val }); return this }
  lte(col: string, val: any) { this.filters.push({ op: 'lte', col, val }); return this }
  gt(col: string, val: any) { this.filters.push({ op: 'gt', col, val }); return this }
  lt(col: string, val: any) { this.filters.push({ op: 'lt', col, val }); return this }
  order(col: string, opts?: { ascending?: boolean }) { this.orderCol = col; this.orderAsc = opts?.ascending !== false; return this }
  limit(n: number) { this.limitN = n; return this }
  single() { this.singleMode = 'single'; return this }
  maybeSingle() { this.singleMode = 'maybe'; return this }

  private matches(row: any): boolean {
    return this.filters.every((f) => {
      const v = row[f.col]
      switch (f.op) {
        case 'eq': return v === f.val
        case 'neq': return v !== f.val
        case 'in': return f.val.includes(v)
        case 'is': return f.val === null ? v == null : v === f.val
        case 'not-is': return f.val === null ? v != null : v !== f.val
        case 'gte': return v >= f.val
        case 'lte': return v <= f.val
        case 'gt': return v > f.val
        case 'lt': return v < f.val
        default: return true
      }
    })
  }

  private resolve() {
    if (this.op !== 'select') {
      // Writes: return a plausible row so .select().single() chains succeed.
      const base = Array.isArray(this.payload) ? this.payload[0] : this.payload
      const row = { id: `gen_${Math.random().toString(36).slice(2, 9)}`, island_id: base?.island_id ?? 'isl1', ...base }
      const data = this.singleMode ? row : Array.isArray(this.payload) ? this.payload.map((p: any, i: number) => ({ id: `gen_${i}`, ...p })) : row
      return { data, error: null, count: null }
    }
    let rows = (TABLES[this.table] ?? []).filter((r) => this.matches(r))
    if (this.orderCol) {
      const col = this.orderCol
      rows = [...rows].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (this.orderAsc ? 1 : -1))
    }
    if (this.head) return { data: null, error: null, count: rows.length }
    if (this.limitN != null) rows = rows.slice(0, this.limitN)
    if (this.singleMode) return { data: rows[0] ?? null, error: null, count: null }
    return { data: rows, error: null, count: rows.length }
  }

  then(onF: (v: any) => any, onR?: (e: any) => any) {
    return Promise.resolve(this.resolve()).then(onF, onR)
  }
}

const session = { user: USER, access_token: 'demo', refresh_token: 'demo', expires_in: 3600, token_type: 'bearer' }

export const supabase: any = {
  auth: {
    getSession: async () => ({ data: { session }, error: null }),
    onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: async () => ({ error: null }),
    signInWithPassword: async () => ({ data: { session }, error: null }),
    signUp: async () => ({ data: { user: USER, session: null }, error: null }),
  },
  from: (table: string) => new Builder(table),
}
