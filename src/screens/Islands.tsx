import { useState, type CSSProperties } from 'react'
import { ScreenScroll } from '../components/Shell'
import { Label, OrbCluster, RegDot, Sentence, SkillChip } from '../components/primitives'
import { Btn, IconBtn, SpeakerBtn } from '../components/ui'
import { I } from '../components/icons'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'
import { ISLAND_TOPICS, IslandTopic } from '../lib/islandTopics'
import {
  Island, IslandSentence,
  fetchIslands, createIsland, addIslandSentence, fetchIslandLines, deleteIsland, fetchIslandRecall,
  deleteIslandSentence, updateIslandSentence, createStarterIsland,
} from '../lib/data/islands'
import { translateSentence, fetchFollowupQuestions, Translation } from '../lib/islandsApi'
import { toRegisterTokens } from '../lib/data/content'
import { ReviewItem } from '../lib/data/review'
import { speak } from '../lib/tts'
import { Speak } from './Speak'
import { RecallRunner } from '../components/RecallRunner'

type View =
  | { v: 'list' }
  | { v: 'create' }
  | { v: 'detail'; id: string }
  | { v: 'shadow'; id: string; from: 'list' | 'detail' }
  | { v: 'recall'; id: string }

export function Islands() {
  const { user } = useAuth()
  const [view, setView] = useState<View>({ v: 'list' })
  const [reload, setReload] = useState(0)
  const bump = () => setReload((k) => k + 1)

  if (!user) return <StatePane title="Ladataan…" bottom={110} />
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
  return <IslandList key={reload} userId={uid}
    onNew={() => setView({ v: 'create' })}
    onOpen={(id) => setView({ v: 'detail', id })}
    onShadow={(id) => setView({ v: 'shadow', id, from: 'list' })} />
}

/* -------------------------------------------------------------------------- */
/* List — the learner's islands + "new island"                                 */
/* -------------------------------------------------------------------------- */
function IslandList({ userId, onNew, onOpen, onShadow }: { userId: string; onNew: () => void; onOpen: (id: string) => void; onShadow: (id: string) => void }) {
  const { bi, bilingual, biText } = useLang()
  const [reload, setReload] = useState(0)
  const { data: islands, loading, error } = useAsync<Island[]>(() => fetchIslands(userId), [userId, reload])
  const [addingStarter, setAddingStarter] = useState(false)
  const [starterErr, setStarterErr] = useState('')
  const [delId, setDelId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const hasStarter = (islands ?? []).some((i) => i.topicSlug === 'starter')
  const addStarter = async () => {
    if (addingStarter) return
    setAddingStarter(true); setStarterErr('')
    try {
      const id = await createStarterIsland(userId)
      onShadow(id) // straight into Listen & repeat, one at a time — not the 50-list
    } catch (e) {
      setAddingStarter(false)
      setStarterErr(e instanceof Error ? e.message : String(e))
    }
  }

  const removeIsland = async (id: string) => {
    if (deleting) return
    setDeleting(true)
    try { await deleteIsland(userId, id); setDelId(null); setReload((n) => n + 1) } catch { /* ignore */ }
    setDeleting(false)
  }

  return (
    <ScreenScroll bottom={110}>
      <div>
        <Label color="var(--written)">Kielisaaret</Label>
        <h1 className="ps-title-1" style={{ marginTop: 8 }}>Kielisaaret</h1>
        {bilingual && <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink-3)', marginTop: 2 }}>(Language Islands)</div>}
        <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 8 }}>
          Build sentences from your own life. You write what you want to say; we turn it into real Finnish you can speak.
        </p>
      </div>

      <button onClick={onNew} className="ps-press" style={{
        marginTop: 18, width: '100%', padding: '16px 18px', borderRadius: 'var(--r-lg)', cursor: 'pointer',
        border: 'none', background: 'var(--spoken)', color: 'var(--on-dark)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.16)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I name="plus" size={22} />
        </span>
        <span style={{ textAlign: 'left' }}>
          <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{bi('Lisää uusi saari', 'Add a new island')}</span>
          <span className="ps-caption" style={{ color: 'rgba(255,255,255,.7)' }}>{bi('Vastaa kysymyksiin omin sanoin', 'Answer questions in your own words')}</span>
        </span>
      </button>

      {/* Starter pack — a ready-made first island for total beginners */}
      {islands && !hasStarter && !loading && (
        <button onClick={() => void addStarter()} disabled={addingStarter} className="ps-press ps-card" style={{
          marginTop: 12, width: '100%', padding: 16, cursor: addingStarter ? 'default' : 'pointer',
          textAlign: 'left', display: 'flex', alignItems: 'center', gap: 13, opacity: addingStarter ? 0.6 : 1,
          border: '1.5px solid var(--written-line)',
        }}>
          <span style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'var(--written-bg)',
            color: 'var(--written)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I name="sparkle" size={22} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>{bi('Aloituspaketti', 'Starter pack')}</span>
            <span className="ps-caption">{addingStarter ? bi('Lisätään…', 'Adding…') : '50 ready-made everyday sentences for newcomers'}</span>
          </span>
          {!addingStarter && <I name="plus" size={20} style={{ color: 'var(--written)', flexShrink: 0 }} />}
        </button>
      )}
      {starterErr && (
        <div className="ps-body" style={{ marginTop: 10, padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--flag-bg)', color: 'var(--flag)' }}>{starterErr}</div>
      )}

      {loading && <div style={{ marginTop: 24 }}><StatePane title={bi('Ladataan…', 'Loading')} /></div>}
      {error && <div style={{ marginTop: 16 }}><StatePane tone="error" title="Couldn't load your islands" detail={error} /></div>}

      {islands && islands.length === 0 && !loading && (
        <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--ink-2)' }}>
          <OrbCluster size={96} />
          <p className="ps-body" style={{ marginTop: 14, maxWidth: 280, marginInline: 'auto' }}>
            No islands yet. Start one above — the first set is the basics: who you are, your work, your day.
          </p>
        </div>
      )}

      {islands && islands.length > 0 && (
        <div style={{ display: 'grid', gap: 12, marginTop: 22 }}>
          {islands.map((isl) => (
            <div key={isl.id} className="ps-card" style={{ padding: 14, opacity: deleting && delId === isl.id ? 0.6 : 1 }}>
              {delId === isl.id ? (
                <div>
                  <div className="ps-body" style={{ fontWeight: 600 }}>{bi('Poistetaanko tämä saari?', 'Delete this island?')}</div>
                  <div className="ps-caption" style={{ marginTop: 4 }}>This removes its sentences and their review history.</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <Btn variant="light" style={{ flex: 1 }} disabled={deleting} onClick={() => setDelId(null)}>{bi('Peruuta', 'Cancel')}</Btn>
                    <Btn variant="primary" style={{ flex: 1 }} disabled={deleting} onClick={() => void removeIsland(isl.id)}>{bi('Poista', 'Delete')}</Btn>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => (isl.topicSlug === 'starter' ? onShadow(isl.id) : onOpen(isl.id))} className="ps-press" style={{
                    flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 14,
                    background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '4px 0',
                  }}>
                    <span style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0, background: 'var(--written-bg)',
                      color: 'var(--written)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <I name={isl.topicSlug === 'starter' ? 'sparkle' : 'island'} size={24} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      {isl.topicSlug === 'starter' && (
                        <span className="ps-label" style={{ display: 'block', color: 'var(--written)', fontSize: 10, marginBottom: 2 }}>{bi('Aloita tästä', 'Start here')}</span>
                      )}
                      <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}>{isl.title}</span>
                      <span className="ps-caption">{biText(`${isl.count} ${isl.count === 1 ? 'lause' : 'lausetta'}`, isl.count === 1 ? 'sentence' : 'sentences')}</span>
                    </span>
                    <I name="arrow" size={20} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
                  </button>
                  {isl.topicSlug !== 'starter' && (
                    <IconBtn icon="trash" tone="glass" size={38} onClick={() => setDelId(isl.id)} label="Delete island" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </ScreenScroll>
  )
}

/* -------------------------------------------------------------------------- */
/* Create flow — topic → answer questions → review & edit → save               */
/* -------------------------------------------------------------------------- */

// One translated sentence awaiting the learner's review before it is saved.
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
  const { bi, biText } = useLang()
  const [topic, setTopic] = useState<IslandTopic | null>(null)
  const [answers, setAnswers] = useState<string[]>([])
  const [phase, setPhase] = useState<'write' | 'translating' | 'review'>('write')
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [progress, setProgress] = useState('')
  const [redoIdx, setRedoIdx] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [extraQs, setExtraQs] = useState<string[]>([])
  const [loadingQs, setLoadingQs] = useState(false)

  const pick = (t: IslandTopic) => { setTopic(t); setAnswers(t.questions.map(() => '')); setExtraQs([]); setPhase('write'); setDrafts([]); setErr('') }
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
      setProgress(`${biText('Käännetään', 'Translating')} ${i + 1}/${items.length}…`)
      const t = await translateSentence(items[i].q, items[i].a)
      if (t.configured && t.kirjakieli) out.push(toDraft(items[i].q, t))
    }
    setProgress('')
    if (out.length === 0) { setPhase('write'); setErr('Translation is unavailable right now. Please try again in a moment.'); return }
    setDrafts(out); setPhase('review')
  }

  // Re-translate one sentence (LLM variance, or after Voikko flagged a word).
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
          en: drafts[i].en, kirjakieli: drafts[i].kirjakieli, puhekieli: drafts[i].puhekieli, verified: drafts[i].verified, sortOrder: i,
        })
      }
      onDone(id)
    } catch (e) {
      setSaving(false)
      setErr(e instanceof Error ? e.message : String(e))
    }
  }

  // The coach asks 2-3 more tailored questions (questions only; you still author).
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

  // Step 1: choose a topic.
  if (!topic) {
    return (
      <ScreenScroll bottom={110}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconBtn icon="arrowL" tone="glass" size={40} onClick={onCancel} />
          <Label color="var(--written)">{bi('Uusi saari', 'New island')}</Label>
          <span style={{ width: 40 }} />
        </div>
        <div style={{ marginTop: 14 }}>
          <h1 className="ps-title-1">{bi('Mistä haluat puhua?', 'What do you want to talk about?')}</h1>
          <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 8 }}>
            Pick a situation from your real life. You'll answer a few questions in your own words.
          </p>
        </div>
        <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
          {ISLAND_TOPICS.map((t) => (
            <button key={t.slug} onClick={() => pick(t)} className="ps-press ps-card" style={{
              padding: 16, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 13,
            }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'var(--written-bg)',
                color: 'var(--written)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I name={t.icon} size={22} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>{bi(t.fi, t.en)}</span>
                <span className="ps-caption">{t.blurb}</span>
              </span>
              <I name="arrow" size={18} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </ScreenScroll>
    )
  }

  // Translating state.
  if (phase === 'translating') {
    return (
      <ScreenScroll bottom={110}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 22 }}>
          <OrbCluster size={140} />
          <div>
            <h2 className="ps-title-1">{bi('Tehdään lauseita', 'Making your sentences')}</h2>
            <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10 }}>{progress || bi('Hetki…', 'One moment…')}</p>
            <p className="ps-caption" style={{ marginTop: 8, maxWidth: 260, marginInline: 'auto' }}>
              Turning your words into simple Finnish, checked word by word.
            </p>
          </div>
        </div>
      </ScreenScroll>
    )
  }

  // Step 3: review & edit the translations before saving.
  if (phase === 'review') {
    return (
      <ScreenScroll bottom={120}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconBtn icon="arrowL" tone="glass" size={40} onClick={() => setPhase('write')} />
          <Label color="var(--written)">{bi('Tarkista', 'Check')}</Label>
          <span style={{ width: 40 }} />
        </div>

        <div style={{ marginTop: 14 }}>
          <h1 className="ps-title-1">{bi('Tarkista lauseet', 'Check your sentences')}</h1>
          <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 8 }}>
            Here is your Finnish, kept simple. Redo any that look off, remove what you don't want, then save.
          </p>
        </div>

        {err && (
          <div className="ps-body" style={{ marginTop: 14, padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--flag-bg)', color: 'var(--flag)' }}>{err}</div>
        )}

        <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
          {drafts.map((d, i) => (
            <div key={i} className="ps-card" style={{ padding: 16, opacity: redoIdx === i ? 0.6 : 1 }}>
              <div className="ps-caption" style={{ fontStyle: 'italic' }}>“{d.en}”</div>
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
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--spoken-bg)', border: '1px solid var(--spoken-line)', borderRadius: 'var(--r-md)' }}>
                  <RegDot reg="puhe" />
                  <div style={{ marginTop: 7 }}>
                    <Sentence tokens={d.puhe} font="var(--font-body)" weight={600} size={16} color="var(--ink)" />
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Btn variant="light" style={{ flex: 1 }} disabled={redoIdx !== null || saving} onClick={() => void redo(i)}>
                  {redoIdx === i ? bi('Hetki…', 'Redoing…') : bi('Yritä uudelleen', 'Redo')}
                </Btn>
                <button className="ps-press" disabled={redoIdx !== null || saving} onClick={() => removeDraft(i)} style={{
                  flex: 1, padding: '12px', borderRadius: 'var(--r-md)', cursor: 'pointer',
                  border: '1.5px solid var(--glass-line)', background: 'transparent', color: 'var(--ink-2)',
                  fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
                }}>{biText('Poista', 'Remove')}</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, minHeight: 16 }} />
        <Btn variant="primary" block iconRight="arrow" disabled={drafts.length === 0 || saving || redoIdx !== null} onClick={() => void save()}>
          {saving ? bi('Tallennetaan…', 'Saving…') : <>{bi('Tallenna saari', 'Save island')} ({drafts.length})</>}
        </Btn>
      </ScreenScroll>
    )
  }

  // Step 2: answer the topic's questions (write full sentences, like the examples).
  return (
    <ScreenScroll bottom={120}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconBtn icon="arrowL" tone="glass" size={40} onClick={() => setTopic(null)} />
        <Label color="var(--written)">{bi(topic.fi, topic.en)}</Label>
        <span style={{ width: 40 }} />
      </div>

      <div style={{ marginTop: 14 }}>
        <h1 className="ps-title-1">{bi('Vastaa omin sanoin', 'Answer in your own words')}</h1>
        <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 8 }}>
          Write a full sentence for each — like the example under it. Skip the ones that don't fit. Fuller English makes simpler, better Finnish.
        </p>
      </div>

      {err && (
        <div className="ps-body" style={{ marginTop: 14, padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--flag-bg)', color: 'var(--flag)' }}>{err}</div>
      )}

      <div style={{ display: 'grid', gap: 14, marginTop: 18 }}>
        {[...topic.questions, ...extraQs.map((q) => ({ q, eg: '' }))].map((qq, i) => (
          <div key={i} className="ps-card" style={{ padding: 14 }}>
            <div className="ps-body" style={{ fontWeight: 600 }}>{qq.q}</div>
            {qq.eg
              ? <div className="ps-caption" style={{ marginTop: 3, fontStyle: 'italic' }}>e.g. {qq.eg}</div>
              : <div className="ps-caption" style={{ marginTop: 3, color: 'var(--written)' }}>{bi('Lisäkysymys', 'Follow-up question')}</div>}
            <textarea
              value={answers[i] || ''}
              onChange={(e) => setAnswer(i, e.target.value)}
              placeholder={qq.eg || biText('Kirjoita kokonainen lause…', 'Write a full sentence…')}
              rows={2}
              style={{
                marginTop: 10, width: '100%', padding: '11px 13px', borderRadius: 'var(--r-md)',
                border: '1.5px solid var(--glass-line)', background: 'var(--glass)', resize: 'none',
                fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15.5, color: 'var(--ink)', outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--written)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--glass-line)')}
            />
          </div>
        ))}
      </div>

      <button onClick={() => void loadMore()} disabled={loadingQs || extraQs.length >= 6} className="ps-press" style={{
        marginTop: 14, width: '100%', padding: '12px', borderRadius: 'var(--r-md)',
        cursor: loadingQs || extraQs.length >= 6 ? 'default' : 'pointer',
        border: '1.5px dashed var(--written-line)', background: 'transparent', color: 'var(--written)',
        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: extraQs.length >= 6 ? 0.5 : 1,
      }}>
        <I name="sparkle" size={16} /> {loadingQs ? biText('Haetaan…', 'Loading…') : biText('Lisää kysymyksiä', 'More questions')}
      </button>

      <div style={{ flex: 1, minHeight: 16 }} />
      <Btn variant="primary" block iconRight="arrow" disabled={filledCount === 0} onClick={() => void translateAll()}>
        {filledCount === 0 ? bi('Kirjoita vastaus', 'Write an answer') : <>{bi('Käännä', 'Translate')} ({filledCount})</>}
      </Btn>
    </ScreenScroll>
  )
}

/* -------------------------------------------------------------------------- */
/* Detail — the island's sentences + practice entry points                     */
/* -------------------------------------------------------------------------- */
const linkBtn: CSSProperties = {
  background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
  color: 'var(--written)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
}
const ghostBtn: CSSProperties = {
  flex: 1, padding: '12px', borderRadius: 'var(--r-md)', cursor: 'pointer',
  border: '1.5px solid var(--glass-line)', background: 'transparent', color: 'var(--ink-2)',
  fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
}
const ghostBtnSm: CSSProperties = {
  padding: '8px 12px', borderRadius: 'var(--r-md)', cursor: 'pointer',
  border: '1.5px solid var(--glass-line)', background: 'transparent', color: 'var(--ink-2)',
  fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
}

function IslandDetail({ userId, islandId, onBack, onShadow, onRecall, onDeleted }: {
  userId: string; islandId: string
  onBack: () => void; onShadow: () => void; onRecall: () => void; onDeleted: () => void
}) {
  const { bi, biText } = useLang()
  const [localReload, setLocalReload] = useState(0)
  const { data: lines, loading, error } = useAsync<IslandSentence[]>(() => fetchIslandLines(userId, islandId), [userId, islandId, localReload])
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

  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={110} />
  if (error) return <StatePane tone="error" title="Couldn't load this island" detail={error} bottom={110} />

  const list = lines ?? []

  return (
    <ScreenScroll bottom={120}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconBtn icon="arrowL" tone="glass" size={40} onClick={onBack} />
        <Label color="var(--written)">Kielisaari</Label>
        <IconBtn icon="close" tone="glass" size={40} onClick={() => setConfirmDel(true)} />
      </div>

      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <SkillChip skill="speak" />
        <span className="ps-label ps-num" style={{ color: 'var(--ink-3)' }}>{biText(`${list.length} ${list.length === 1 ? 'lause' : 'lausetta'}`, list.length === 1 ? 'sentence' : 'sentences')}</span>
      </div>

      {/* Practice actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <Btn variant="primary" icon="speaker" style={{ flex: 1 }} onClick={onShadow}>{bi('Kuuntele & toista', 'Listen & repeat')}</Btn>
        <Btn variant="light" icon="cards" style={{ flex: 1 }} onClick={onRecall}>{bi('Kertaa', 'Recall')}</Btn>
      </div>

      {confirmDel && (
        <div className="ps-card" style={{ marginTop: 16, padding: 16, border: '1px solid var(--flag)' }}>
          <div className="ps-body" style={{ fontWeight: 600 }}>{bi('Poistetaanko tämä saari?', 'Delete this island?')}</div>
          <div className="ps-caption" style={{ marginTop: 4 }}>This removes its sentences and their review history.</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <Btn variant="light" style={{ flex: 1 }} onClick={() => setConfirmDel(false)}>{bi('Peruuta', 'Cancel')}</Btn>
            <Btn variant="primary" style={{ flex: 1 }} disabled={busy} onClick={() => void remove()}>{bi('Poista', 'Delete')}</Btn>
          </div>
        </div>
      )}

      {/* Sentences */}
      <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
        {list.map((s) => (
          <div key={s.id} className="ps-card" style={{ padding: 16, opacity: editBusy && (editId === s.id || delSentId === s.id) ? 0.6 : 1 }}>
            {editId === s.id ? (
              <div>
                <div className="ps-caption">{bi('Muokkaa englanniksi, käännä uudelleen', 'Edit the English, then re-translate')}</div>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={2}
                  style={{
                    marginTop: 8, width: '100%', padding: '11px 13px', borderRadius: 'var(--r-md)',
                    border: '1.5px solid var(--written)', background: 'var(--glass)', resize: 'none',
                    fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15.5, color: 'var(--ink)', outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button className="ps-press" disabled={editBusy} onClick={() => setEditId(null)} style={ghostBtn}>{biText('Peruuta', 'Cancel')}</button>
                  <Btn variant="primary" style={{ flex: 1 }} disabled={editBusy || !editText.trim()} onClick={() => void saveEdit(s.id)}>
                    {editBusy ? bi('Käännetään…', 'Translating…') : bi('Käännä uudelleen', 'Re-translate')}
                  </Btn>
                </div>
              </div>
            ) : (
              <>
                <div className="ps-caption" style={{ fontStyle: 'italic' }}>“{s.en}”</div>
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
                  <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--spoken-bg)', border: '1px solid var(--spoken-line)', borderRadius: 'var(--r-md)' }}>
                    <RegDot reg="puhe" />
                    <div style={{ marginTop: 7 }}>
                      <Sentence tokens={s.puhe} font="var(--font-body)" weight={600} size={16} color="var(--ink)" />
                    </div>
                  </div>
                )}
                {delSentId === s.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                    <span className="ps-caption" style={{ flex: 1 }}>{bi('Poistetaanko tämä lause?', 'Remove this sentence?')}</span>
                    <button className="ps-press" disabled={editBusy} onClick={() => setDelSentId(null)} style={ghostBtnSm}>{biText('Peruuta', 'Cancel')}</button>
                    <button className="ps-press" disabled={editBusy} onClick={() => void removeSentence(s.id)} style={{ ...ghostBtnSm, color: 'var(--flag)', borderColor: 'var(--flag)' }}>{biText('Poista', 'Remove')}</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                    <button className="ps-press" onClick={() => startEdit(s)} style={linkBtn}>{biText('Muokkaa', 'Edit')}</button>
                    <button className="ps-press" onClick={() => { setEditId(null); setDelSentId(s.id) }} style={{ ...linkBtn, color: 'var(--ink-3)' }}>{biText('Poista', 'Delete')}</button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </ScreenScroll>
  )
}

/* -------------------------------------------------------------------------- */
/* Shadow — reuse the Speak screen with this island's sentences                */
/* -------------------------------------------------------------------------- */
function ShadowView({ userId, islandId, onBack }: { userId: string; islandId: string; onBack: () => void }) {
  const { data: lines, loading, error } = useAsync<IslandSentence[]>(() => fetchIslandLines(userId, islandId), [userId, islandId])
  if (loading) return <StatePane title="Ladataan…" bottom={110} />
  if (error) return <StatePane tone="error" title="Couldn't load" detail={error} bottom={110} />
  return <Speak phrases={lines ?? []} title="Kielisaari" onBack={onBack} />
}

/* -------------------------------------------------------------------------- */
/* Recall — active recall: type the Finnish, the system grades it (RecallRunner) */
/* -------------------------------------------------------------------------- */
function RecallView({ userId, islandId, onBack }: { userId: string; islandId: string; onBack: () => void }) {
  const { bi } = useLang()
  const { data, loading, error } = useAsync<ReviewItem[]>(
    async () => (await fetchIslandRecall(userId, islandId)).map((card): ReviewItem => ({ kind: 'island', card })),
    [userId, islandId],
  )

  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={110} />
  if (error) return <StatePane tone="error" title="Couldn't load recall" detail={error} bottom={110} />
  if (!data || data.length === 0) return <StatePane title={bi('Ei lauseita', 'No sentences')} detail="Add a sentence to this island first." bottom={110} />

  return <RecallRunner key={data.map((it) => it.card.cardId).join(',')} items={data} userId={userId}
    titleFi="Kielisaari" titleEn="Island recall" onExit={onBack} />
}
