import { useState } from 'react'
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
} from '../lib/data/islands'
import { translateSentence } from '../lib/islandsApi'
import { rateCard, previewIntervals } from '../lib/data/cards'
import { Rating } from '../lib/fsrs/types'
import { speak } from '../lib/tts'
import { Speak } from './Speak'

type View =
  | { v: 'list' }
  | { v: 'create' }
  | { v: 'detail'; id: string }
  | { v: 'shadow'; id: string }
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
    return <ShadowView userId={uid} islandId={view.id} onBack={() => setView({ v: 'detail', id: view.id })} />
  }
  if (view.v === 'recall') {
    return <RecallView userId={uid} islandId={view.id} onBack={() => setView({ v: 'detail', id: view.id })} />
  }
  if (view.v === 'detail') {
    return <IslandDetail key={view.id + reload} userId={uid} islandId={view.id}
      onBack={() => setView({ v: 'list' })}
      onShadow={() => setView({ v: 'shadow', id: view.id })}
      onRecall={() => setView({ v: 'recall', id: view.id })}
      onDeleted={() => { bump(); setView({ v: 'list' }) }} />
  }
  return <IslandList key={reload} userId={uid}
    onNew={() => setView({ v: 'create' })}
    onOpen={(id) => setView({ v: 'detail', id })} />
}

/* -------------------------------------------------------------------------- */
/* List — the learner's islands + "new island"                                 */
/* -------------------------------------------------------------------------- */
function IslandList({ userId, onNew, onOpen }: { userId: string; onNew: () => void; onOpen: (id: string) => void }) {
  const { bi } = useLang()
  const { data: islands, loading, error } = useAsync<Island[]>(() => fetchIslands(userId), [userId])

  return (
    <ScreenScroll bottom={110}>
      <div>
        <Label color="var(--spoken)">Kielisaaret</Label>
        <h1 className="ps-title-1" style={{ marginTop: 8 }}>{bi('Kielisaaret', 'Language Islands')}</h1>
        <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 8 }}>
          Build sentences from your own life. You write what you want to say; we turn it into real Finnish you can speak.
        </p>
      </div>

      <button onClick={onNew} className="ps-press" style={{
        marginTop: 18, width: '100%', padding: '16px 18px', borderRadius: 'var(--r-lg)', cursor: 'pointer',
        border: 'none', background: 'var(--ink)', color: 'var(--on-dark)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.16)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I name="plus" size={22} />
        </span>
        <span style={{ textAlign: 'left' }}>
          <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{bi('Uusi saari', 'New island')}</span>
          <span className="ps-caption" style={{ color: 'rgba(255,255,255,.7)' }}>{bi('Vastaa kysymyksiin omin sanoin', 'Answer questions in your own words')}</span>
        </span>
      </button>

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
            <button key={isl.id} onClick={() => onOpen(isl.id)} className="ps-press ps-card" style={{
              padding: 18, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0, background: 'var(--spoken-bg)',
                color: 'var(--spoken)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I name="island" size={24} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}>{isl.title}</span>
                <span className="ps-caption">{isl.count} {isl.count === 1 ? bi('lause', 'sentence') : bi('lausetta', 'sentences')}</span>
              </span>
              <I name="arrow" size={20} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}
    </ScreenScroll>
  )
}

/* -------------------------------------------------------------------------- */
/* Create flow — pick a topic, answer its questions, build the island          */
/* -------------------------------------------------------------------------- */
function CreateFlow({ userId, onCancel, onDone }: { userId: string; onCancel: () => void; onDone: (id: string) => void }) {
  const { bi } = useLang()
  const [topic, setTopic] = useState<IslandTopic | null>(null)
  const [answers, setAnswers] = useState<string[]>([])
  const [building, setBuilding] = useState(false)
  const [progress, setProgress] = useState('')
  const [err, setErr] = useState('')

  const pick = (t: IslandTopic) => { setTopic(t); setAnswers(t.questions.map(() => '')) }
  const setAnswer = (i: number, val: string) => setAnswers((a) => a.map((x, idx) => (idx === i ? val : x)))
  const filledCount = answers.filter((a) => a.trim()).length

  const build = async () => {
    if (!topic || building) return
    const written = answers.map((a) => a.trim()).filter(Boolean)
    if (written.length === 0) { setErr('Write at least one answer first.'); return }
    setBuilding(true); setErr('')

    let islandId = ''
    try {
      islandId = await createIsland(userId, topic.en, topic.slug)
      let saved = 0
      for (let i = 0; i < written.length; i++) {
        setProgress(`${bi('Käännetään', 'Translating')} ${i + 1}/${written.length}…`)
        const t = await translateSentence(written[i])
        if (t.configured && t.kirjakieli) {
          await addIslandSentence(userId, islandId, {
            en: written[i], kirjakieli: t.kirjakieli, puhekieli: t.puhekieli, verified: t.verified, sortOrder: i,
          })
          saved++
        }
      }
      if (saved === 0) {
        await deleteIsland(userId, islandId)
        setBuilding(false); setProgress('')
        setErr('Translation is unavailable right now. Please try again in a moment.')
        return
      }
      onDone(islandId)
    } catch (e) {
      setBuilding(false); setProgress('')
      setErr(e instanceof Error ? e.message : String(e))
    }
  }

  // Step 1: choose a topic.
  if (!topic) {
    return (
      <ScreenScroll bottom={110}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconBtn icon="arrowL" tone="glass" size={40} onClick={onCancel} />
          <Label color="var(--spoken)">{bi('Uusi saari', 'New island')}</Label>
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

  // Building state.
  if (building) {
    return (
      <ScreenScroll bottom={110}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 22 }}>
          <OrbCluster size={140} />
          <div>
            <h2 className="ps-title-1">{bi('Rakennetaan saartasi', 'Building your island')}</h2>
            <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10 }}>{progress || bi('Hetki…', 'One moment…')}</p>
            <p className="ps-caption" style={{ marginTop: 8, maxWidth: 260, marginInline: 'auto' }}>
              Turning your words into real Finnish, checked word by word.
            </p>
          </div>
        </div>
      </ScreenScroll>
    )
  }

  // Step 2: answer the topic's questions.
  return (
    <ScreenScroll bottom={120}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconBtn icon="arrowL" tone="glass" size={40} onClick={() => setTopic(null)} />
        <Label color="var(--spoken)">{bi(topic.fi, topic.en)}</Label>
        <span style={{ width: 40 }} />
      </div>

      <div style={{ marginTop: 14 }}>
        <h1 className="ps-title-1">{bi('Vastaa omin sanoin', 'Answer in your own words')}</h1>
        <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 8 }}>
          Write in English. Answer the ones that fit your life — skip the rest. This is *your* island, so sound like you.
        </p>
      </div>

      {err && (
        <div className="ps-body" style={{ marginTop: 14, padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--flag-bg)', color: 'var(--flag)' }}>{err}</div>
      )}

      <div style={{ display: 'grid', gap: 14, marginTop: 18 }}>
        {topic.questions.map((q, i) => (
          <div key={i} className="ps-card" style={{ padding: 14 }}>
            <div className="ps-body" style={{ fontWeight: 600 }}>{q}</div>
            <textarea
              value={answers[i]}
              onChange={(e) => setAnswer(i, e.target.value)}
              placeholder={bi('Kirjoita vastauksesi…', 'Your answer…') as string}
              rows={2}
              style={{
                marginTop: 10, width: '100%', padding: '11px 13px', borderRadius: 'var(--r-md)',
                border: '1.5px solid var(--glass-line)', background: 'var(--glass)', resize: 'none',
                fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15.5, color: 'var(--ink)', outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--spoken)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--glass-line)')}
            />
          </div>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 16 }} />
      <Btn variant="primary" block iconRight="arrow" disabled={filledCount === 0} onClick={() => void build()}>
        {filledCount === 0 ? bi('Kirjoita vastaus', 'Write an answer') : `${bi('Rakenna saari', 'Build island')} (${filledCount})`}
      </Btn>
    </ScreenScroll>
  )
}

/* -------------------------------------------------------------------------- */
/* Detail — the island's sentences + practice entry points                     */
/* -------------------------------------------------------------------------- */
function IslandDetail({ userId, islandId, onBack, onShadow, onRecall, onDeleted }: {
  userId: string; islandId: string
  onBack: () => void; onShadow: () => void; onRecall: () => void; onDeleted: () => void
}) {
  const { bi } = useLang()
  const { data: lines, loading, error } = useAsync<IslandSentence[]>(() => fetchIslandLines(userId, islandId), [userId, islandId])
  const [confirmDel, setConfirmDel] = useState(false)
  const [busy, setBusy] = useState(false)

  const remove = async () => {
    if (busy) return
    setBusy(true)
    try { await deleteIsland(userId, islandId); onDeleted() } catch { setBusy(false) }
  }

  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={110} />
  if (error) return <StatePane tone="error" title="Couldn't load this island" detail={error} bottom={110} />

  const list = lines ?? []

  return (
    <ScreenScroll bottom={120}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconBtn icon="arrowL" tone="glass" size={40} onClick={onBack} />
        <Label color="var(--spoken)">Kielisaari</Label>
        <IconBtn icon="close" tone="glass" size={40} onClick={() => setConfirmDel(true)} />
      </div>

      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <SkillChip skill="speak" />
        <span className="ps-label ps-num" style={{ color: 'var(--ink-3)' }}>{list.length} {bi('lausetta', 'sentences')}</span>
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
          <div key={s.id} className="ps-card" style={{ padding: 16 }}>
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
            {!s.verified && (
              <div className="ps-caption" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-3)' }}>
                <I name="lock" size={13} /> {bi('Luonnos — suomi vielä vahvistamatta', 'Draft — Finnish not yet verified')}
              </div>
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
/* Recall — active recall (English -> produce Finnish), scheduled by FSRS       */
/* -------------------------------------------------------------------------- */
const RATING_ROW: { r: Rating; fi: string; en: string }[] = [
  { r: Rating.Again, fi: 'Uudelleen', en: 'Again' },
  { r: Rating.Hard, fi: 'Vaikea', en: 'Hard' },
  { r: Rating.Good, fi: 'Hyvä', en: 'Good' },
  { r: Rating.Easy, fi: 'Helppo', en: 'Easy' },
]

function RecallView({ userId, islandId, onBack }: { userId: string; islandId: string; onBack: () => void }) {
  const { bi } = useLang()
  const { data, loading, error } = useAsync(() => fetchIslandRecall(userId, islandId), [userId, islandId])

  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={110} />
  if (error) return <StatePane tone="error" title="Couldn't load recall" detail={error} bottom={110} />
  if (!data || data.length === 0) return <StatePane title={bi('Ei lauseita', 'No sentences')} detail="Add a sentence to this island first." bottom={110} />

  return <RecallSession key={data.map((c) => c.cardId).join(',')} cards={data} userId={userId} onBack={onBack} />
}

function RecallSession({ cards, userId, onBack }: {
  cards: Awaited<ReturnType<typeof fetchIslandRecall>>; userId: string; onBack: () => void
}) {
  const { bi } = useLang()
  const [i, setI] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const card = cards[i]
  const previews = previewIntervals(card)

  const rate = async (r: Rating) => {
    if (busy) return
    setBusy(true)
    try { await rateCard(userId, card, r) } catch { /* keep moving; schedule retried next session */ }
    setBusy(false)
    if (i < cards.length - 1) { setI(i + 1); setRevealed(false) }
    else setDone(true)
  }

  if (done) return (
    <ScreenScroll bottom={110}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 22 }}>
        <OrbCluster size={180} />
        <div>
          <Label color="var(--spoken)" style={{ display: 'block', marginBottom: 10 }}>{bi('Kertaus valmis', 'Recall complete')}</Label>
          <h2 className="ps-title-1">{bi('Hyvää työtä!', 'Great work!')}</h2>
          <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10, maxWidth: 300 }}>
            Saying your own sentences from memory is where real speaking is built.
          </p>
        </div>
        <Btn variant="primary" onClick={onBack}>{bi('Takaisin', 'Back to island')}</Btn>
      </div>
    </ScreenScroll>
  )

  return (
    <ScreenScroll bottom={110}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconBtn icon="arrowL" tone="glass" size={40} onClick={onBack} />
        <span className="ps-label ps-num" style={{ color: 'var(--ink-2)' }}>{i + 1} / {cards.length}</span>
        <span style={{ width: 40 }} />
      </div>

      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Label color="var(--spoken)">{bi('Sano se suomeksi', 'Say it in Finnish')}</Label>
        <SkillChip skill="speak" />
      </div>

      {/* English prompt */}
      <div className="ps-glass" style={{ marginTop: 18, padding: 18 }}>
        <div className="ps-caption">{bi('Sano tämä suomeksi', 'Say this in Finnish')}</div>
        <div style={{ marginTop: 8, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 23, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          “{card.line.en}”
        </div>
      </div>

      {!revealed ? (
        <>
          <div style={{ flex: 1, minHeight: 16 }} />
          <p className="ps-caption" style={{ textAlign: 'center', marginBottom: 12 }}>
            {bi('Sano se ääneen, sitten tarkista.', 'Say it aloud, then check yourself.')}
          </p>
          <Btn variant="primary" block iconRight="arrow" onClick={() => setRevealed(true)}>{bi('Näytä vastaus', 'Reveal')}</Btn>
        </>
      ) : (
        <>
          <div className="ps-card" style={{ marginTop: 14, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <RegDot reg="kirja" />
                <div style={{ marginTop: 7 }}>
                  <Sentence tokens={card.line.kirja} font="var(--font-display)" weight={600} size={21} color="var(--ink)" />
                </div>
              </div>
              <SpeakerBtn reg="kirja" onClick={() => speak(card.line.kirjaText)} size={42} />
            </div>
            {card.line.puheText && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--spoken-bg)', border: '1px solid var(--spoken-line)', borderRadius: 'var(--r-md)' }}>
                <RegDot reg="puhe" />
                <div style={{ marginTop: 7 }}>
                  <Sentence tokens={card.line.puhe} font="var(--font-body)" weight={600} size={16} color="var(--ink)" />
                </div>
              </div>
            )}
          </div>

          <div style={{ flex: 1, minHeight: 14 }} />
          <div className="ps-caption" style={{ textAlign: 'center', marginBottom: 8 }}>{bi('Miten meni?', 'How did it go?')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {RATING_ROW.map(({ r, fi, en }) => (
              <button key={r} disabled={busy} onClick={() => void rate(r)} className="ps-press" style={{
                padding: '12px 4px', borderRadius: 'var(--r-md)', cursor: busy ? 'default' : 'pointer',
                border: '1.5px solid var(--glass-line)', background: 'var(--glass-2)', color: 'var(--ink)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13 }}>{bi(fi, en)}</span>
                <span className="ps-num" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{previews[r]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </ScreenScroll>
  )
}
