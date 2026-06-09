import { supabase } from '../supabase/client'
import { toRegisterTokens, ShadowLine, fetchIslandSentences } from './content'
import type { CardSchedule } from './cards'

/* ---------------------------------------------------------------------------
 * Personal Language Islands — the learner's OWN sentences.
 *
 * Each island is a group of sentences for one real-life situation. The learner
 * authors them (English first); we translate to validated Finnish. They then
 * feed the SAME engines as everything else: shadowing (Speak) and active recall
 * (a 'island_recall' FSRS card), so personal sentences get spaced repetition for
 * free instead of living in a sandbox.
 * ------------------------------------------------------------------------- */

export interface Island {
  id: string
  title: string
  topicSlug: string
  createdAt: string
  count: number   // how many sentences it holds
  learned: number // how many of its recall cards have graduated to 'review'
}

// A single island sentence, tokenised for the register UI. `gloss` (= the
// learner's English) lets it drop straight into the shadowing component.
export interface IslandSentence extends ShadowLine {
  id: string
  islandId: string
  en: string
  kirjaText: string
  puheText: string
  verified: boolean
}

export interface IslandRecallCard extends CardSchedule {
  line: IslandSentence
}

function toLine(row: {
  id: string; island_id: string; en: string; kirjakieli: string; puhekieli: string | null; verified: boolean
}): IslandSentence {
  const { kirja, puhe } = toRegisterTokens(row.kirjakieli, row.puhekieli ?? row.kirjakieli)
  return {
    id: row.id,
    islandId: row.island_id,
    en: row.en,
    gloss: row.en,
    kirja,
    puhe,
    kirjaText: row.kirjakieli,
    puheText: row.puhekieli ?? '',
    verified: row.verified,
  }
}

/** The learner's islands, newest first, each with its sentence + learned counts. */
export async function fetchIslands(userId: string): Promise<Island[]> {
  const { data: islands, error } = await supabase
    .from('user_islands')
    .select('id, title, topic_slug, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  const { data: lines } = await supabase
    .from('user_island_sentences')
    .select('id, island_id')
    .eq('user_id', userId)
  const counts = new Map<string, number>()
  const islandOfSentence = new Map<string, string>()
  for (const l of lines ?? []) {
    counts.set(l.island_id, (counts.get(l.island_id) ?? 0) + 1)
    islandOfSentence.set(l.id, l.island_id)
  }

  // Learned = this island's recall cards that have graduated to 'review'.
  const { data: cards } = await supabase
    .from('cards')
    .select('island_sentence_id, state')
    .eq('user_id', userId).eq('card_type', 'island_recall').eq('state', 'review')
    .not('island_sentence_id', 'is', null)
  const learned = new Map<string, number>()
  for (const c of cards ?? []) {
    const isl = islandOfSentence.get(c.island_sentence_id as string)
    if (isl) learned.set(isl, (learned.get(isl) ?? 0) + 1)
  }

  return (islands ?? []).map((i) => ({
    id: i.id, title: i.title, topicSlug: i.topic_slug, createdAt: i.created_at,
    count: counts.get(i.id) ?? 0,
    learned: learned.get(i.id) ?? 0,
  }))
}

export async function createIsland(userId: string, title: string, topicSlug: string): Promise<string> {
  const { data, error } = await supabase
    .from('user_islands')
    .insert({ user_id: userId, title: title.trim() || 'My island', topic_slug: topicSlug })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id
}

export async function deleteIsland(userId: string, islandId: string): Promise<void> {
  // Sentences + their FSRS cards cascade away via FK ON DELETE CASCADE.
  const { error } = await supabase.from('user_islands').delete().eq('id', islandId).eq('user_id', userId)
  if (error) throw new Error(error.message)
}

/** Delete one sentence from an island (its FSRS card cascades via FK). */
export async function deleteIslandSentence(userId: string, sentenceId: string): Promise<void> {
  const { error } = await supabase.from('user_island_sentences').delete().eq('id', sentenceId).eq('user_id', userId)
  if (error) throw new Error(error.message)
}

/** Update one sentence's content (after the learner edits + re-translates it).
 *  The FSRS schedule on its card is left untouched. */
export async function updateIslandSentence(
  userId: string,
  sentenceId: string,
  fields: { en: string; kirjakieli: string; puhekieli: string; verified: boolean },
): Promise<IslandSentence> {
  const { data, error } = await supabase
    .from('user_island_sentences')
    .update({
      en: fields.en.trim(),
      kirjakieli: fields.kirjakieli.trim(),
      puhekieli: fields.puhekieli.trim() || null,
      verified: fields.verified,
    })
    .eq('id', sentenceId).eq('user_id', userId)
    .select('id, island_id, en, kirjakieli, puhekieli, verified')
    .single()
  if (error) throw new Error(error.message)
  return toLine(data)
}

/**
 * Create the "Starter pack" island from the 50 Voikko-validated everyday (arki)
 * sentences — a ready-made first island for total beginners that flows through
 * the same shadow/recall/FSRS engines as any personal island. Batched inserts.
 */
export async function createStarterIsland(userId: string): Promise<string> {
  const sents = await fetchIslandSentences(50)
  if (sents.length === 0) throw new Error('Starter sentences are not loaded yet.')

  const islandId = await createIsland(userId, 'Everyday basics', 'starter')

  const rows = sents.map((s, i) => ({
    island_id: islandId, user_id: userId,
    en: s.gloss,
    kirjakieli: s.kirja.map((t) => t.t).join(' '),
    puhekieli: s.puhe.map((t) => t.t).join(' ') || null,
    verified: true, // the arki kirjakieli is Voikko-validated seed content
    sort_order: i,
  }))
  const { data: inserted, error } = await supabase.from('user_island_sentences').insert(rows).select('id')
  if (error) throw new Error(error.message)

  const cards = (inserted ?? []).map((r) => ({
    user_id: userId, island_sentence_id: r.id, card_type: 'island_recall' as const,
    state: 'new' as const, due: new Date().toISOString(),
    stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, last_review: null,
  }))
  if (cards.length) await supabase.from('cards').insert(cards)

  return islandId
}

export async function fetchIslandLines(userId: string, islandId: string): Promise<IslandSentence[]> {
  const { data, error } = await supabase
    .from('user_island_sentences')
    .select('id, island_id, en, kirjakieli, puhekieli, verified')
    .eq('user_id', userId).eq('island_id', islandId)
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(toLine)
}

/**
 * Save one authored sentence to an island and enter it into the scheduler as a
 * fresh 'island_recall' card (due now), so it shows up for active recall and
 * then follows the normal FSRS spacing. Returns the saved line.
 */
export async function addIslandSentence(
  userId: string,
  islandId: string,
  line: { en: string; kirjakieli: string; puhekieli: string; verified: boolean; sortOrder?: number },
): Promise<IslandSentence> {
  const { data, error } = await supabase
    .from('user_island_sentences')
    .insert({
      island_id: islandId, user_id: userId,
      en: line.en.trim(), kirjakieli: line.kirjakieli.trim(),
      puhekieli: line.puhekieli.trim() || null, verified: line.verified,
      sort_order: line.sortOrder ?? 0,
    })
    .select('id, island_id, en, kirjakieli, puhekieli, verified')
    .single()
  if (error) throw new Error(error.message)

  // Seed a fresh recall card (best-effort: authoring still succeeds if this fails).
  try {
    await supabase.from('cards').insert({
      user_id: userId, island_sentence_id: data.id, card_type: 'island_recall',
      state: 'new', due: new Date().toISOString(),
      stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0,
      last_review: null,
    })
  } catch { /* the sentence is saved; it just won't have a recall card yet */ }

  return toLine(data)
}

const RECALL_COLS = 'id, island_sentence_id, stability, difficulty, state, reps, lapses, due, scheduled_days, elapsed_days, last_review'

/**
 * The recall session for one island: every sentence in it, as real FSRS cards,
 * ordered most-due first. Reusing the cards table means rateCard()/previewIntervals()
 * work unchanged and each rating is logged + scheduled like any other review.
 */
export async function fetchIslandRecall(userId: string, islandId: string): Promise<IslandRecallCard[]> {
  const lines = await fetchIslandLines(userId, islandId)
  if (lines.length === 0) return []
  const byId = new Map(lines.map((l) => [l.id, l]))

  const { data: cards, error } = await supabase
    .from('cards').select(RECALL_COLS)
    .eq('user_id', userId).eq('card_type', 'island_recall')
    .in('island_sentence_id', [...byId.keys()])
    .order('due', { ascending: true })
  if (error) throw new Error(error.message)

  return (cards ?? [])
    .filter((c) => c.island_sentence_id && byId.has(c.island_sentence_id))
    .map((c) => ({
      cardId: c.id,
      isNew: c.state === 'new',
      line: byId.get(c.island_sentence_id as string)!,
      stability: c.stability, difficulty: c.difficulty, state: c.state,
      reps: c.reps, lapses: c.lapses, due: c.due,
      scheduled_days: c.scheduled_days, elapsed_days: c.elapsed_days, last_review: c.last_review,
    }))
}

/**
 * Due personal island sentences across ALL islands — the sentence track of the
 * daily review. Due now or earlier, soonest-due first, INCLUDING brand-new ones
 * (a freshly-authored sentence is due immediately, so it shows up to review the
 * same day rather than disappearing).
 */
export async function fetchDueIslandRecall(userId: string, limit: number): Promise<IslandRecallCard[]> {
  const now = new Date().toISOString()
  const { data: cards, error } = await supabase
    .from('cards').select(RECALL_COLS)
    .eq('user_id', userId).eq('card_type', 'island_recall').not('island_sentence_id', 'is', null)
    .lte('due', now)
    .order('due', { ascending: true }).limit(limit)
  if (error) throw new Error(error.message)
  const rows = cards ?? []
  if (rows.length === 0) return []

  const { data: lines, error: lErr } = await supabase
    .from('user_island_sentences')
    .select('id, island_id, en, kirjakieli, puhekieli, verified')
    .in('id', rows.map((c) => c.island_sentence_id as string))
  if (lErr) throw new Error(lErr.message)
  const byId = new Map((lines ?? []).map((l) => [l.id, toLine(l)]))

  return rows
    .filter((c) => c.island_sentence_id && byId.has(c.island_sentence_id))
    .map((c) => ({
      cardId: c.id,
      isNew: c.state === 'new',
      line: byId.get(c.island_sentence_id as string)!,
      stability: c.stability, difficulty: c.difficulty, state: c.state,
      reps: c.reps, lapses: c.lapses, due: c.due,
      scheduled_days: c.scheduled_days, elapsed_days: c.elapsed_days, last_review: c.last_review,
    }))
}
