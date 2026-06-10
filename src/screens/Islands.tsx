import { useState } from 'react'
import { ScreenScroll, AppScreen, BottomNav } from '../components/Shell'
import { BrandMark, RegDot, Sentence, SkillChip } from '../components/primitives'
import { Bar, SpeakerBtn, Btn } from '../components/ui'
import { I } from '../components/icons'
import { CTA, ExBar, CenterLabel, HubHeader, Eyebrow, IconTile, FieldArea, RoundBtn } from '../components/kit'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'
import { ISLAND_TOPICS, IslandTopic } from '../lib/islandTopics'
import {
  Island, IslandSentence,
  fetchIslands, createIsland, addIslandSentence, fetchIslandLines, deleteIsland, fetchIslandRecall,
  deleteIslandSentence, updateIslandSentence, createStarterIsland, refreshStarterIsland, isStarterIsland,
} from '../lib/data/islands'
import { translateSentence, fetchFollowupQuestions, Translation } from '../lib/islandsApi'
import { toRegisterTokens } from '../lib/data/content'
import { ReviewItem } from '../lib/data/review'
import { speak } from '../lib/tts'
import { Speak } from './Speak'
import { RecallRunner } from '../components/RecallRunner'

/* ---------------------------------------------------------------------------
 * My Sentence Bank — the learner's own life, in Finnish. They author sets of
 * sentences (English first, we translate to beginner Finnish); the sets feed
 * the same shadow/recall/FSRS engines as everything else.
 * ------------------------------------------------------------------------- */

const BODY_BOTTOM = 96

// Row accents cycle through the brand tones, like the design's set list.
const TONES: { tone: string; bg: string; icon: string }[] = [
  { tone: 'var(--written)', bg: 'var(--written-bg)', icon: 'sparkle' },
  { tone: 'var(--spoken)',  bg: 'var(--spoken-bg)',  icon: 'sprout' },
  { tone: 'var(--flag)',    bg: 'var(--flag-bg)',    icon: 'bolt' },
  { tone: '#C2603F',        bg: 'rgba(194,96,63,.12)', icon: 'pencil' },
]

type View =
  | { v: 'list' }
  | { v: 'create' }
  | { v: 'detail'; id: string }
  | { v: 'shadow'; id: string; from: 'list' | 'detail' }
  | { v: 'recall'; id: string }

export function Islands({ go }: { go: (s: AppScreen) => void }) {
  const { user } = useAuth()
  const [view, setView] = useState<View>({ v: 'list' })
  const [reload, setReload] = useState(0)
  const bump = () => setReload((k) => k + 1)

  if (!user) return <StatePane title="Ladataan…" bottom={BODY_BOTTOM + 14} />
  const uid = user.id

  if (view.v === 'create') {
    return <CreateFlow userId={uid} onCancel={() => setView({ v: 'list' })}
      onDone={(id) => { bump(); setView({ v: 'detail', id }) }} />
  }
  if (view.v === 'shadow') {
    return <ShadowView userId={uid} islandId={view.id}
      onBack={() => (view.from === 'list' ? setView({ v: 'list' }) : setView({ v: 'detail', id: view.id }))} />
  }
  if (view.v === 'recall') {
    return <RecallView userId={uid} islandId={view.id} onBack={() => setView({ v: 'detail', id: view.id })} />
  }
  if (view.v === 'detail') {
    return <IslandDetail key={view.id + reload} userId={uid} islandId={view.id}
      onBack={() => setView({ v: 'list' })}
      onShadow={() => setView({ v: 'shadow', id: view.id, from: 'detail' })}
      onRecall={() => setView({ v: 'recall', id: view.id })}
      onDeleted={() => { bump(); setView({ v: 'list' }) }} />
  }
  return (
    <>
      <IslandList key={reload} userId={uid}
        onNew={() => setView({ v: 'create' })}
        onOpen={(id) => setView({ v: 'detail', id })}
        onShadow={(id) => setView({ v: 'shadow', id, from: 'list' })} />
      <BottomNav active="islands" onNav={go} />
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* List — stats, the learner's sets, starter pack, new set                     */
/* -------------------------------------------------------------------------- */
function IslandList({ userId, onNew, onOpen, onShadow }: {
  userId: string; onNew: () => void; onOpen: (id: string) => void; onShadow: (id: string) => void
}) {
  const { bi, bilingual } = useLang()
  const [reload, setReload] = useState(0)
  const { data: islands, loading, error } = useAsync<Island[]>(() => fetchIslands(userId), [userId, reload])
  const [addingStarter, setAddingStarter] = useState(false)
  const [starterErr, setStarterErr] = useState('')
  void reload

  const starterIsland = (islands ?? []).find(isStarterIsland)
  const hasStarter = !!starterIsland
  const starterCount = starterIsland?.count ?? 0
  const totalSentences = (islands ?? []).reduce((a, i) => a + i.count, 0)
  const totalLearned = (islands ?? []).reduce((a, i) => a + i.learned, 0)

  const addStarter = async () => {
    if (addingStarter) return
    setAddingStarter(true); setStarterErr('')
    try {
      const id = await createStarterIsland(userId)
      onShadow(id) // straight into Listen & repeat, one sentence at a time
    } catch (e) {
      setAddingStarter(false)
      setStarterErr(e instanceof Error ? e.message : String(e))
      setReload((n) => n + 1)
    }
  }

  // One tap: delete the old starter copy and re-create it from the latest seed.
  // A created copy never auto-updates when the source sentences change, so this
  // is how the learner pulls in the updated set (e.g. 50 -> 104).
  const refreshStarter = async () => {
    if (addingStarter) return
    setAddingStarter(true); setStarterErr('')
    try {
      await refreshStarterIsland(userId)
      setReload((n) => n + 1) // show the refreshed count in the list right away
      setAddingStarter(false)
    } catch (e) {
      setAddingStarter(false)
      setStarterErr(e instanceof Error ? e.message : String(e))
      setReload((n) => n + 1)
    }
  }

  return (
    <ScreenScroll bottom={BODY_BOTTOM} style={{ paddingTop: 62 }}>
      <HubHeader eyebrowFi="SENTENCE BANK" title="Omat lauseet"
        sub="Your own life, in Finnish. Build sets from real situations you live." />

      {/* Stat strip */}
      <div className="ps-card" style={{ marginTop: 20, padding: 16, borderRadius: 'var(--r-lg)',
        display: 'flex', gap: 16, alignItems: 'center' }}>
        <Stat n={(islands ?? []).length} fi="settiä" en="sets" />
        <span style={{ width: 1, alignSelf: 'stretch', background: 'var(--glass-edge)' }} />
        <Stat n={totalSentences} fi="lausetta" en="sentences" />
        <span style={{ width: 1, alignSelf: 'stretch', background: 'var(--glass-edge)' }} />
        <Stat n={totalLearned} fi="opittu" en="learned" />
      </div>

      {/* Starter pack — a ready-made first set for total beginners */}
      {islands && !hasStarter && !loading && (
        <button onClick={() => void addStarter()} disabled={addingStarter} className="ps-press ps-card" style={{
          marginTop: 14, width: '100%', padding: 16, cursor: addingStarter ? 'default' : 'pointer',
          textAlign: 'left', display: 'flex', alignItems: 'center', gap: 13, opacity: addingStarter ? 0.6 : 1,
          border: '1.5px solid var(--written-line)', borderRadius: 'var(--r-lg)',
        }}>
          <IconTile icon="sparkle" size={44} r={12} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="ps-label" style={{ display: 'block', color: 'var(--written)', fontSize: 10, marginBottom: 2 }}>
              {bi('Aloita tästä', 'Start here')}
            </span>
            <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Aloituspaketti</span>
            <span className="ps-caption">{addingStarter ? bi('Lisätään…', 'Adding') : 'Real everyday sentences, ready to practise'}</span>
          </span>
          {!addingStarter && <span style={{ color: 'var(--written)', flexShrink: 0 }}><I name="plus" size={20} /></span>}
        </button>
      )}

      {/* Already have the starter pack — offer a one-tap refresh to the latest set.
          A created copy doesn't auto-update, so this is how 50 becomes 104. */}
      {islands && hasStarter && !loading && (
        <button onClick={() => void refreshStarter()} disabled={addingStarter} className="ps-press ps-card" style={{
          marginTop: 14, width: '100%', padding: 16, cursor: addingStarter ? 'default' : 'pointer',
          textAlign: 'left', display: 'flex', alignItems: 'center', gap: 13, opacity: addingStarter ? 0.6 : 1,
          border: '1.5px solid var(--written-line)', borderRadius: 'var(--r-lg)',
        }}>
          <IconTile icon="refresh" size={44} r={12} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="ps-label" style={{ display: 'block', color: 'var(--written)', fontSize: 10, marginBottom: 2 }}>
              {bi('Aloituspaketti', 'Starter pack')}
            </span>
            <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>
              {bi('Päivitä aloituspaketti', 'Refresh starter pack')}
            </span>
            <span className="ps-caption">
              {addingStarter
                ? bi('Päivitetään…', 'Refreshing')
                : `Replace your copy (${starterCount}) with the latest sentences`}
            </span>
          </span>
          {!addingStarter && <span style={{ color: 'var(--written)', flexShrink: 0 }}><I name="refresh" size={20} /></span>}
        </button>
      )}
      {starterErr && (
        <div className="ps-body" style={{ marginTop: 10, padding: '12px 16px', borderRadius: 'var(--r-md)',
          background: 'var(--flag-bg)', color: 'var(--flag)' }}>{starterErr}</div>
      )}

      {loading && <div style={{ marginTop: 24 }}><StatePane title={bi('Ladataan…', 'Loading')} /></div>}
      {error && <div style={{ marginTop: 16 }}><StatePane tone="error" title="Couldn't load your sets" detail={error} /></div>}

      {islands && islands.length === 0 && !loading && (
        <div style={{ textAlign: 'center', marginTop: 36, color: 'var(--ink-2)' }}>
          <BrandMark size={88} style={{ margin: '0 auto' }} />
          <p className="ps-body" style={{ marginTop: 14, maxWidth: 280, marginInline: 'auto' }}>
            No sets yet. Add one below, starting with the basics: who you are, your work, your day.
          </p>
        </div>
      )}

      {islands && islands.length > 0 && (
        <>
          <Eyebrow fi="SETTISI" en="Your sets" color="var(--ink-3)" style={{ marginTop: 24, marginBottom: 14 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {islands.map((isl, idx) => {
              const starter = isStarterIsland(isl)
              const t = starter ? TONES[0] : TONES[idx % TONES.length]
              return (
                <button key={isl.id} className="ps-card ps-press"
                  onClick={() => (starter ? onShadow(isl.id) : onOpen(isl.id))}
                  style={{ padding: 16, borderRadius: 'var(--r-lg)', display: 'flex', alignItems: 'center', gap: 14,
                    width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer' }}>
                  <IconTile icon={starter ? 'sparkle' : t.icon} color={t.tone} bg={t.bg} />
                  <span style={{ flex: 1, minWidth: 0, display: 'block' }}>
                    {starter && (
                      <span className="ps-label" style={{ display: 'block', color: 'var(--written)', fontSize: 10, marginBottom: 2 }}>
                        {bi('Aloita tästä', 'Start here')}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.5, color: 'var(--ink)' }}>{isl.title}</span>
                      {bilingual && (
                        <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 500, fontSize: 12, color: 'var(--ink-3)' }}>
                          {isl.count} {isl.count === 1 ? 'sentence' : 'sentences'}
                        </span>
                      )}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 9 }}>
                      <span style={{ flex: 1 }}>
                        <Bar value={isl.count > 0 ? (isl.learned / isl.count) * 100 : 0} color={t.tone} track="var(--glass-deep)" h={6} />
                      </span>
                      <span className="ps-num" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5, color: 'var(--ink-3)', flexShrink: 0 }}>
                        {isl.learned}/{isl.count}
                      </span>
                    </span>
                  </span>
                  <span style={{ color: 'var(--ink-3)', flexShrink: 0 }}><I name="arrow" size={20} sw={2} /></span>
                </button>
              )
            })}
          </div>
        </>
      )}

      <div style={{ height: 16 }} />
      <CTA fi="Uusi setti" en="New set" icon="plus" variant="ink" onClick={onNew} />
    </ScreenScroll>
  )
}

function Stat({ n, fi, en }: { n: number; fi: string; en: string }) {
  const { bilingual } = useLang()
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div className="ps-num" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20.3,
        letterSpacing: '-0.03em', color: 'var(--ink)' }}>{n}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13.5, color: 'var(--ink-2)', marginTop: 2 }}>{fi}</div>
      {bilingual && <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11.5, color: 'var(--ink-3)' }}>{en}</div>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Create flow — topic → answer questions → review & edit → save               */
/* -------------------------------------------------------------------------- */

// Generic questions for a learner-described situation.
const CUSTOM_QUESTIONS = [
  { q: 'What do you want to be able to say in this situation?', eg: 'Hello, I have an appointment at two o\'clock.' },
  { q: 'What might you need to ask?', eg: 'Can you help me with this form?' },
  { q: 'What will they probably say or ask you?', eg: 'Do you have your card with you?' },
  { q: 'How would you answer?', eg: 'Yes, here it is.' },
]

type Draft = {
  question: string
  en: string
  kirjakieli: string
  puhekieli: string
  verified: boolean
  kirja: ReturnType<typeof toRegisterTokens>['kirja']
  puhe: ReturnType<typeof toRegisterTokens>['puhe']
}

function CreateFlow({ userId, onCancel, onDone }: { userId: string; onCancel: () => void; onDone: (id: string) => void }) {
  const { bi, biText, bilingual } = useLang()
  const [topic, setTopic] = useState<IslandTopic | null>(null)
  const [selected, setSelected] = useState<IslandTopic | null>(null)
  const [customOpen, setCustomOpen] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [answers, setAnswers] = useState<string[]>([])
  const [phase, setPhase] = useState<'write' | 'translating' | 'review'>('write')
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [progressText, setProgressText] = useState('')
  const [redoIdx, setRedoIdx] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [extraQs, setExtraQs] = useState<string[]>([])
  const [loadingQs, setLoadingQs] = useState(false)

  const begin = (t: IslandTopic) => {
    setTopic(t); setAnswers(t.questions.map(() => '')); setExtraQs([]); setPhase('write'); setDrafts([]); setErr('')
  }
  const setAnswer = (i: number, val: string) => setAnswers((a) => a.map((x, idx) => (idx === i ? val : x)))
  const filledCount = answers.filter((a) => a.trim()).length

  const toDraft = (question: string, t: Translation): Draft => {
    const { kirja, puhe } = toRegisterTokens(t.kirjakieli, t.puhekieli || t.kirjakieli)
    return { question, en: t.en, kirjakieli: t.kirjakieli, puhekieli: t.puhekieli, verified: t.verified, kirja, puhe }
  }

  // Translate every answer, then show the review step so nothing saves unseen.
  const translateAll = async () => {
    if (!topic || phase === 'translating') return
    const qList = [...topic.questions.map((q) => q.q), ...extraQs]
    const items = qList.map((q, i) => ({ q, a: (answers[i] || '').trim() })).filter((x) => x.a)
    if (items.length === 0) { setErr('Write at least one answer first.'); return }
    setPhase('translating'); setErr('')
    const out: Draft[] = []
    for (let i = 0; i < items.length; i++) {
      setProgressText(`${biText('Käännetään', 'Translating')} ${i + 1}/${items.length}…`)
      const t = await translateSentence(items[i].q, items[i].a)
      if (t.configured && t.kirjakieli) out.push(toDraft(items[i].q, t))
    }
    setProgressText('')
    if (out.length === 0) { setPhase('write'); setErr('Translation is unavailable right now. Please try again in a moment.'); return }
    setDrafts(out); setPhase('review')
  }

  const redo = async (i: number) => {
    if (redoIdx !== null || saving) return
    setRedoIdx(i)
    const t = await translateSentence(drafts[i].question, drafts[i].en)
    if (t.configured && t.kirjakieli) setDrafts((d) => d.map((x, idx) => (idx === i ? toDraft(drafts[i].question, t) : x)))
    setRedoIdx(null)
  }
  const removeDraft = (i: number) => setDrafts((d) => d.filter((_, idx) => idx !== i))

  const save = async () => {
    if (!topic || saving || drafts.length === 0) return
    setSaving(true); setErr('')
    try {
      const id = await createIsland(userId, topic.en, topic.slug)
      for (let i = 0; i < drafts.length; i++) {
        await addIslandSentence(userId, id, {
          en: drafts[i].en, kirjakieli: drafts[i].kirjakieli, puhekieli: drafts[i].puhekieli,
          verified: drafts[i].verified, sortOrder: i,
        })
      }
      onDone(id)
    } catch (e) {
      setSaving(false)
      setErr(e instanceof Error ? e.message : String(e))
    }
  }

  // The coach asks 2-3 more tailored questions (questions only; you author).
  const loadMore = async () => {
    if (!topic || loadingQs) return
    setLoadingQs(true)
    const qs = await fetchFollowupQuestions(topic.en, answers.filter((a) => a.trim()))
    if (qs.length) {
      setExtraQs((p) => [...p, ...qs])
      setAnswers((p) => [...p, ...qs.map(() => '')])
    }
    setLoadingQs(false)
  }

  /* ---- Step 1: choose a topic ---- */
  if (!topic) {
    return (
      <ScreenScroll bottom={26}>
        <ExBar nav="back" onNav={onCancel} center={<CenterLabel fi="UUSI SETTI · 1/3" en="New set · step 1 of 3" />}>
          <Bar value={33} color="var(--ink)" track="var(--glass-deep)" h={7} />
        </ExBar>
        <div style={{ marginTop: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 23, lineHeight: 1.02,
            letterSpacing: '-0.03em', color: 'var(--ink)', margin: 0 }}>Mistä haluat puhua?</h1>
          {bilingual && (
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: 'var(--ink-3)', margin: '6px 0 0' }}>
              What do you want to talk about?
            </p>
          )}
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, lineHeight: 1.45,
            color: 'var(--ink-2)', margin: '14px 0 0' }}>Pick a situation, or describe your own.</p>
        </div>

        <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {ISLAND_TOPICS.map((t) => {
            const on = selected?.slug === t.slug
            return (
              <button key={t.slug} onClick={() => { setSelected(t); setCustomOpen(false) }} className="ps-card ps-press" style={{
                padding: '16px 14px', borderRadius: 'var(--r-lg)', textAlign: 'left', cursor: 'pointer',
                border: on ? '1.5px solid var(--written)' : '1px solid var(--glass-line)',
                background: on ? 'var(--written-bg)' : '#fff',
              }}>
                <IconTile icon={t.icon} size={38} r={12} color="var(--written)" bg={on ? '#fff' : 'var(--written-bg)'} />
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.9, color: 'var(--ink)', marginTop: 10 }}>{t.fi}</div>
                {bilingual && (
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-3)' }}>{t.en}</div>
                )}
              </button>
            )
          })}
        </div>

        {/* Describe your own */}
        {!customOpen ? (
          <button onClick={() => { setCustomOpen(true); setSelected(null) }} className="ps-press" style={{
            marginTop: 14, width: '100%', padding: '16px 18px', borderRadius: 'var(--r-lg)',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            border: '1.5px dashed var(--glass-edge)', background: 'transparent', textAlign: 'left',
          }}>
            <span style={{ color: 'var(--ink-3)' }}><I name="pencil" size={20} sw={1.9} /></span>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: 'var(--ink-3)' }}>
              Kuvaile omin sanoin…{' '}
              {bilingual && <span style={{ fontSize: 13 }}>describe your own</span>}
            </span>
          </button>
        ) : (
          <div className="ps-card" style={{ marginTop: 14, padding: 16, borderRadius: 'var(--r-lg)', border: '1.5px solid var(--written)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.9, color: 'var(--ink)', marginBottom: 8 }}>
              Oma tilanne{bilingual && <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 500, fontSize: 12, color: 'var(--ink-3)', marginLeft: 8 }}>your own situation</span>}
            </div>
            <FieldArea value={customTitle} onChange={setCustomTitle} rows={1}
              placeholder={biText('esim. Parturissa', 'e.g. At the barber')} autoFocus
              style={{ fontSize: 15.5, padding: '12px 14px' }} />
          </div>
        )}

        {err && (
          <div className="ps-body" style={{ marginTop: 14, padding: '12px 16px', borderRadius: 'var(--r-md)',
            background: 'var(--flag-bg)', color: 'var(--flag)' }}>{err}</div>
        )}

        <div style={{ flex: 1, minHeight: 16 }} />
        <CTA fi="Jatka" en="Continue" iconRight="arrow" variant="ink" style={{ marginTop: 14 }}
          disabled={!selected && !(customOpen && customTitle.trim())}
          onClick={() => {
            if (selected) begin(selected)
            else if (customOpen && customTitle.trim()) {
              const title = customTitle.trim()
              begin({ slug: 'custom', fi: title, en: title, icon: 'pencil', blurb: '', questions: CUSTOM_QUESTIONS })
            }
          }} />
      </ScreenScroll>
    )
  }

  /* ---- Translating ---- */
  if (phase === 'translating') {
    return (
      <ScreenScroll bottom={26}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          alignItems: 'center', textAlign: 'center', gap: 22 }}>
          <BrandMark size={120} />
          <div>
            <h2 className="ps-title-1">{bi('Tehdään lauseita', 'Making your sentences')}</h2>
            <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10 }}>{progressText || bi('Hetki…', 'One moment')}</p>
            <p className="ps-caption" style={{ marginTop: 8, maxWidth: 260, marginInline: 'auto' }}>
              Turning your words into simple Finnish, checked word by word.
            </p>
          </div>
        </div>
      </ScreenScroll>
    )
  }

  /* ---- Step 3: review & edit before saving ---- */
  if (phase === 'review') {
    return (
      <ScreenScroll bottom={26}>
        <ExBar nav="back" onNav={() => setPhase('write')} center={<CenterLabel fi="UUSI SETTI · 3/3" en="New set · step 3 of 3" />}>
          <Bar value={100} color="var(--ink)" track="var(--glass-deep)" h={7} />
        </ExBar>

        <div style={{ marginTop: 16 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 23,
            letterSpacing: '-0.03em', color: 'var(--ink)', margin: 0 }}>Tarkista lauseet</h1>
          {bilingual && (
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: 'var(--ink-3)', margin: '6px 0 0' }}>
              Check your sentences
            </p>
          )}
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, lineHeight: 1.45, color: 'var(--ink-2)', margin: '12px 0 0' }}>
            Here is your Finnish, kept simple. Redo any that look off, remove what you don't want, then save.
          </p>
        </div>

        {err && (
          <div className="ps-body" style={{ marginTop: 14, padding: '12px 16px', borderRadius: 'var(--r-md)',
            background: 'var(--flag-bg)', color: 'var(--flag)' }}>{err}</div>
        )}

        <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
          {drafts.map((d, i) => (
            <div key={i} className="ps-card" style={{ padding: 16, borderRadius: 'var(--r-lg)', opacity: redoIdx === i ? 0.6 : 1 }}>
              <div className="ps-caption">"{d.en}"</div>
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <RegDot reg="kirja" />
                  <div style={{ marginTop: 7 }}>
                    <Sentence tokens={d.kirja} font="var(--font-display)" weight={600} size={20} color="var(--ink)" />
                  </div>
                </div>
                <SpeakerBtn reg="kirja" onClick={() => speak(d.kirjakieli)} size={40} />
              </div>
              {d.puhekieli && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--spoken-bg)',
                  border: '1px solid var(--spoken-line)', borderRadius: 'var(--r-md)' }}>
                  <RegDot reg="puhe" />
                  <div style={{ marginTop: 7 }}>
                    <Sentence tokens={d.puhe} font="var(--font-body)" weight={600} size={16} color="var(--ink)" />
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Btn variant="light" sm style={{ flex: 1 }} disabled={redoIdx !== null || saving} onClick={() => void redo(i)}>
                  {redoIdx === i ? bi('Hetki…', 'Redoing') : bi('Yritä uudelleen', 'Redo')}
                </Btn>
                <Btn variant="ghost" sm style={{ flex: 1, border: '1.5px solid var(--glass-line)' }}
                  disabled={redoIdx !== null || saving} onClick={() => removeDraft(i)}>
                  {bi('Poista', 'Remove')}
                </Btn>
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, minHeight: 16 }} />
        <CTA fi={saving ? 'Tallennetaan…' : `Tallenna setti (${drafts.length})`}
          en={saving ? 'Saving' : 'Save set'} iconRight="arrow" variant="ink"
          disabled={drafts.length === 0 || saving || redoIdx !== null} onClick={() => void save()} />
      </ScreenScroll>
    )
  }

  /* ---- Step 2: answer the questions ---- */
  return (
    <ScreenScroll bottom={26}>
      <ExBar nav="back" onNav={() => { setTopic(null); setErr('') }} center={<CenterLabel fi="UUSI SETTI · 2/3" en="New set · step 2 of 3" />}>
        <Bar value={66} color="var(--ink)" track="var(--glass-deep)" h={7} />
      </ExBar>

      <div style={{ marginTop: 16 }}>
        <Eyebrow fi={topic.fi.toUpperCase()} en={topic.en !== topic.fi ? topic.en : undefined} color="var(--written)" style={{ marginBottom: 12 }} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 21.1, lineHeight: 1.05,
          letterSpacing: '-0.03em', color: 'var(--ink)', margin: 0 }}>
          Pari kysymystä, niin teemme sinulle sopivat lauseet.
        </h1>
        {bilingual && (
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: 'var(--ink-3)', margin: '8px 0 0' }}>
            A couple of questions, so we build sentences that fit you. Answer in English; skip any that don't fit.
          </p>
        )}
      </div>

      {err && (
        <div className="ps-body" style={{ marginTop: 14, padding: '12px 16px', borderRadius: 'var(--r-md)',
          background: 'var(--flag-bg)', color: 'var(--flag)' }}>{err}</div>
      )}

      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[...topic.questions, ...extraQs.map((q) => ({ q, eg: '' }))].map((qq, i) => (
          <div key={i}>
            <div style={{ marginBottom: 7 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.8, color: 'var(--ink)' }}>{qq.q}</div>
              {qq.eg
                ? <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>e.g. {qq.eg}</div>
                : <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5, color: 'var(--written)', marginTop: 2 }}>{bi('Lisäkysymys', 'Follow-up question')}</div>}
            </div>
            <FieldArea value={answers[i] || ''} onChange={(v) => setAnswer(i, v)} rows={2}
              placeholder={qq.eg || biText('Kirjoita kokonainen lause…', 'Write a full sentence')}
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15.5 }} />
          </div>
        ))}
      </div>

      <button onClick={() => void loadMore()} disabled={loadingQs || extraQs.length >= 6} className="ps-press" style={{
        marginTop: 14, width: '100%', padding: 12, borderRadius: 'var(--r-md)',
        cursor: loadingQs || extraQs.length >= 6 ? 'default' : 'pointer',
        border: '1.5px dashed var(--written-line)', background: 'transparent', color: 'var(--written)',
        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: extraQs.length >= 6 ? 0.5 : 1,
      }}>
        <I name="sparkle" size={16} /> {loadingQs ? biText('Haetaan…', 'Loading') : biText('Lisää kysymyksiä', 'More questions')}
      </button>

      <div style={{ flex: 1, minHeight: 16 }} />
      <CTA fi={filledCount === 0 ? 'Kirjoita vastaus' : 'Luo lauseet'}
        en={filledCount === 0 ? 'Write an answer first' : `Generate sentences · ${filledCount}`}
        icon="sparkle" variant="ink" disabled={filledCount === 0} onClick={() => void translateAll()} />
    </ScreenScroll>
  )
}

/* -------------------------------------------------------------------------- */
/* Detail — the set's sentences + practice entry points                        */
/* -------------------------------------------------------------------------- */
function IslandDetail({ userId, islandId, onBack, onShadow, onRecall, onDeleted }: {
  userId: string; islandId: string
  onBack: () => void; onShadow: () => void; onRecall: () => void; onDeleted: () => void
}) {
  const { bi, biText } = useLang()
  const [localReload, setLocalReload] = useState(0)
  const { data: lines, loading, error } = useAsync<IslandSentence[]>(
    () => fetchIslandLines(userId, islandId), [userId, islandId, localReload])
  const [confirmDel, setConfirmDel] = useState(false)
  const [busy, setBusy] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editBusy, setEditBusy] = useState(false)
  const [delSentId, setDelSentId] = useState<string | null>(null)

  const remove = async () => {
    if (busy) return
    setBusy(true)
    try { await deleteIsland(userId, islandId); onDeleted() } catch { setBusy(false) }
  }

  const startEdit = (s: IslandSentence) => { setDelSentId(null); setEditId(s.id); setEditText(s.en) }

  const saveEdit = async (id: string) => {
    const text = editText.trim()
    if (!text || editBusy) return
    setEditBusy(true)
    const t = await translateSentence('', text)
    if (t.configured && t.kirjakieli) {
      try {
        await updateIslandSentence(userId, id, { en: t.en, kirjakieli: t.kirjakieli, puhekieli: t.puhekieli, verified: t.verified })
        setEditId(null); setLocalReload((n) => n + 1)
      } catch { /* leave the editor open so the learner can retry */ }
    }
    setEditBusy(false)
  }

  const removeSentence = async (id: string) => {
    if (editBusy) return
    setEditBusy(true)
    try { await deleteIslandSentence(userId, id); setDelSentId(null); setLocalReload((n) => n + 1) } catch { /* ignore */ }
    setEditBusy(false)
  }

  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={26} />
  if (error) return <StatePane tone="error" title="Couldn't load this set" detail={error} bottom={26} />

  const list = lines ?? []

  return (
    <ScreenScroll bottom={26}>
      <ExBar nav="back" onNav={onBack} center={<CenterLabel fi="SETTI" en="Set" />}
        right={<RoundBtn icon="volume" onClick={onShadow} />} />

      <div style={{ marginTop: 16 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 23,
          letterSpacing: '-0.03em', color: 'var(--ink)', margin: 0 }}>Omat lauseet</h1>
        <div style={{ display: 'flex', gap: 7, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <SkillChip skill="read" />
          <SkillChip skill="speak" />
          <span className="ps-label ps-num" style={{ color: 'var(--ink-3)' }}>
            {list.length} {list.length === 1 ? 'LAUSE' : 'LAUSETTA'}
          </span>
        </div>
      </div>

      {/* Practice actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <CTA fi="Kuuntele & toista" en="Listen & repeat" icon="volume" variant="ink" flex="1.2" onClick={onShadow} />
        <CTA fi="Kertaa" en="Recall" icon="review" variant="light" flex="1" onClick={onRecall} />
      </div>

      {/* Sentences */}
      <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
        {list.map((s) => (
          <div key={s.id} className="ps-card" style={{ padding: 16, borderRadius: 'var(--r-lg)',
            opacity: editBusy && (editId === s.id || delSentId === s.id) ? 0.6 : 1 }}>
            {editId === s.id ? (
              <div>
                <div className="ps-caption">{bi('Muokkaa englanniksi, käännä uudelleen', 'Edit the English, then re-translate')}</div>
                <FieldArea value={editText} onChange={setEditText} rows={2} tone="var(--written)"
                  style={{ marginTop: 8, fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15.5 }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <Btn variant="ghost" sm style={{ border: '1.5px solid var(--glass-line)' }} disabled={editBusy}
                    onClick={() => setEditId(null)}>{biText('Peruuta', 'Cancel')}</Btn>
                  <Btn variant="primary" sm style={{ flex: 1 }} disabled={editBusy || !editText.trim()} onClick={() => void saveEdit(s.id)}>
                    {editBusy ? bi('Käännetään…', 'Translating') : bi('Käännä uudelleen', 'Re-translate')}
                  </Btn>
                </div>
              </div>
            ) : (
              <>
                <div className="ps-caption">"{s.en}"</div>
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <RegDot reg="kirja" />
                    <div style={{ marginTop: 7 }}>
                      <Sentence tokens={s.kirja} font="var(--font-display)" weight={600} size={20} color="var(--ink)" />
                    </div>
                  </div>
                  <SpeakerBtn reg="kirja" onClick={() => speak(s.kirjaText)} size={40} />
                </div>
                {s.puheText && (
                  <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--spoken-bg)',
                    border: '1px solid var(--spoken-line)', borderRadius: 'var(--r-md)' }}>
                    <RegDot reg="puhe" />
                    <div style={{ marginTop: 7 }}>
                      <Sentence tokens={s.puhe} font="var(--font-body)" weight={600} size={16} color="var(--ink)" />
                    </div>
                  </div>
                )}
                {delSentId === s.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                    <span className="ps-caption" style={{ flex: 1 }}>{bi('Poistetaanko tämä lause?', 'Remove this sentence?')}</span>
                    <Btn variant="ghost" sm style={{ border: '1.5px solid var(--glass-line)' }} disabled={editBusy}
                      onClick={() => setDelSentId(null)}>{biText('Peruuta', 'Cancel')}</Btn>
                    <Btn variant="ghost" sm style={{ border: '1.5px solid #C2603F', color: '#C2603F' }} disabled={editBusy}
                      onClick={() => void removeSentence(s.id)}>{biText('Poista', 'Remove')}</Btn>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                    <button className="ps-press" onClick={() => startEdit(s)} style={{
                      background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                      color: 'var(--written)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13 }}>
                      {biText('Muokkaa', 'Edit')}
                    </button>
                    <button className="ps-press" onClick={() => { setEditId(null); setDelSentId(s.id) }} style={{
                      background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                      color: 'var(--ink-3)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13 }}>
                      {biText('Poista', 'Delete')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Delete the whole set */}
      <div style={{ marginTop: 22, marginBottom: 6 }}>
        {!confirmDel ? (
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => setConfirmDel(true)} className="ps-press" style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, textDecoration: 'underline' }}>
              {bi('Poista setti', 'Delete set')}
            </button>
          </div>
        ) : (
          <div className="ps-card" style={{ padding: 16, border: '1px solid #C2603F', borderRadius: 'var(--r-lg)' }}>
            <div className="ps-body" style={{ fontWeight: 600 }}>{bi('Poistetaanko tämä setti?', 'Delete this set?')}</div>
            <div className="ps-caption" style={{ marginTop: 4 }}>This removes its sentences and their review history.</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <Btn variant="light" sm style={{ flex: 1 }} onClick={() => setConfirmDel(false)}>{bi('Peruuta', 'Cancel')}</Btn>
              <Btn variant="primary" sm style={{ flex: 1, background: '#C2603F' }} disabled={busy} onClick={() => void remove()}>
                {bi('Poista', 'Delete')}
              </Btn>
            </div>
          </div>
        )}
      </div>
    </ScreenScroll>
  )
}

/* -------------------------------------------------------------------------- */
/* Shadow — reuse the Speak screen with this set's sentences                   */
/* -------------------------------------------------------------------------- */
function ShadowView({ userId, islandId, onBack }: { userId: string; islandId: string; onBack: () => void }) {
  const { data: lines, loading, error } = useAsync<IslandSentence[]>(
    () => fetchIslandLines(userId, islandId), [userId, islandId])
  if (loading) return <StatePane title="Ladataan…" bottom={26} />
  if (error) return <StatePane tone="error" title="Couldn't load" detail={error} bottom={26} />
  // Resume each set where the learner left off (per user + set).
  return <Speak phrases={lines ?? []} onBack={onBack} resumeKey={`puhuscribe:shadow:${userId}:${islandId}`} />
}

/* -------------------------------------------------------------------------- */
/* Recall — type the Finnish; the system grades it (RecallRunner)              */
/* -------------------------------------------------------------------------- */
function RecallView({ userId, islandId, onBack }: { userId: string; islandId: string; onBack: () => void }) {
  const { bi } = useLang()
  const { data, loading, error } = useAsync<ReviewItem[]>(
    async () => (await fetchIslandRecall(userId, islandId)).map((card): ReviewItem => ({ kind: 'island', card })),
    [userId, islandId],
  )

  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={26} />
  if (error) return <StatePane tone="error" title="Couldn't load recall" detail={error} bottom={26} />
  if (!data || data.length === 0) return <StatePane title={bi('Ei lauseita', 'No sentences')} detail="Add a sentence to this set first." bottom={26} />

  return <RecallRunner key={data.map((it) => it.card.cardId).join(',')} items={data} userId={userId}
    titleFi="Omat lauseet" titleEn="Your sentences" onExit={onBack} />
}
