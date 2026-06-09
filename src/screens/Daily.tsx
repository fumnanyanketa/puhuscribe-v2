import { useMemo, useState, type ReactNode } from 'react'
import { OrbCluster, Label, RegDot, Sentence } from '../components/primitives'
import { Btn, Steps, SpeakerBtn, IconBtn } from '../components/ui'
import { I } from '../components/icons'
import { ScreenScroll, AppScreen } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'
import { fetchVocabSession, rateCard, previewIntervals } from '../lib/data/cards'
import { fetchDueIslandRecall } from '../lib/data/islands'
import { fetchReviewOverview, ReviewOverview, ReviewItem } from '../lib/data/review'
import { Rating } from '../lib/fsrs/types'
import { speak } from '../lib/tts'

const SESSION_SIZE = 12
const VOCAB_GOAL = 1000
const SENT_GOAL = 1000

// Rating buttons: Again/Hard/Good/Easy, each tinted with a brand token and
// showing the FSRS-computed next interval underneath.
const RATINGS: { rating: Rating; fi: string; en: string; color: string; bg: string }[] = [
  { rating: Rating.Again, fi: 'Taas',   en: 'again', color: 'var(--flag)',    bg: 'var(--flag-bg)' },
  { rating: Rating.Hard,  fi: 'Vaikea', en: 'hard',  color: 'var(--ink-2)',   bg: 'var(--glass-2)' },
  { rating: Rating.Good,  fi: 'Hyvä',   en: 'good',  color: 'var(--written)', bg: 'rgba(107,70,193,.12)' },
  { rating: Rating.Easy,  fi: 'Helppo', en: 'easy',  color: 'var(--spoken)',  bg: 'var(--spoken-bg)' },
]

type View = 'hub' | 'vocab' | 'sentences'

export function Daily({ go }: { go: (s: AppScreen) => void }) {
  const { user } = useAuth()
  const { bi } = useLang()
  const [view, setView] = useState<View>('hub')

  if (!user) return <StatePane title={bi('Kirjaudu sisään', 'Sign in')} detail="Sign in to start your review." bottom={110} />

  if (view === 'vocab') return <VocabTrack userId={user.id} go={go} onExit={() => setView('hub')} />
  if (view === 'sentences') return <SentenceTrack userId={user.id} go={go} onExit={() => setView('hub')} />
  return <Hub userId={user.id} go={go} onVocab={() => setView('vocab')} onSentences={() => setView('sentences')} />
}

/* -------------------------------------------------------------------------- */
/* Hub — the two daily tracks, each with its bank progress                      */
/* -------------------------------------------------------------------------- */
function Hub({ userId, go, onVocab, onSentences }: {
  userId: string; go: (s: AppScreen) => void; onVocab: () => void; onSentences: () => void
}) {
  const { bi } = useLang()
  const { data, loading, error } = useAsync<ReviewOverview>(() => fetchReviewOverview(userId), [userId])

  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={110} />
  if (error) return <StatePane tone="error" title="Couldn't load your review" detail={error} bottom={110} />
  const o = data!

  return (
    <ScreenScroll bottom={110}>
      <Label color="var(--written)">{bi('Päivän kertaus', 'daily review')}</Label>
      <h1 className="ps-title-1" style={{ marginTop: 8 }}>{bi('Kertaus', 'Review')}</h1>
      <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 8 }}>
        Two banks to grow a little every day — your words and your own sentences.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 4px' }}>
        <OrbCluster size={104} />
      </div>

      <div style={{ display: 'grid', gap: 14, marginTop: 10 }}>
        <TrackCard
          icon="cards" accent="var(--written)" accentBg="var(--written-bg)"
          fi="Sanasto" en="Vocabulary" unitFi="sanaa" unitEn="words"
          bank={o.vocabBank} goal={VOCAB_GOAL} due={o.vocabDue}
          startFi="Aloita sanat" startEn="Learn words" onStart={() => go('dayone')} onReview={onVocab}
        />
        <TrackCard
          icon="island" accent="var(--spoken)" accentBg="var(--spoken-bg)"
          fi="Omat lauseet" en="Your sentences" unitFi="lausetta" unitEn="sentences"
          bank={o.sentBank} goal={SENT_GOAL} due={o.sentDue}
          startFi="Rakenna saari" startEn="Build an island" onStart={() => go('islands')} onReview={onSentences}
        />
      </div>
    </ScreenScroll>
  )
}

function TrackCard({ icon, accent, accentBg, fi, en, unitFi, unitEn, bank, goal, due, startFi, startEn, onStart, onReview }: {
  icon: string; accent: string; accentBg: string
  fi: string; en: string; unitFi: string; unitEn: string
  bank: number; goal: number; due: number
  startFi: string; startEn: string; onStart: () => void; onReview: () => void
}) {
  const { bi } = useLang()
  const pct = Math.min(100, Math.round((bank / goal) * 100))
  const empty = bank === 0

  return (
    <div className="ps-card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <span style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0, background: accentBg, color: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I name={icon} size={24} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}>{bi(fi, en)}</div>
          <div className="ps-caption ps-num" style={{ marginTop: 2 }}>{bank} / {goal} {bi(unitFi, unitEn)}</div>
        </div>
        {!empty && due > 0 && (
          <span className="ps-chip" style={{ background: accentBg, color: accent, fontSize: 11, padding: '5px 10px', flexShrink: 0 }}>
            {due} {bi('vuorossa', 'due')}
          </span>
        )}
      </div>

      {/* Bank progress toward the goal */}
      <div style={{ marginTop: 14, height: 7, borderRadius: 999, background: 'var(--glass-deep)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: accent, transition: 'width .5s' }} />
      </div>

      <div style={{ marginTop: 14 }}>
        {empty ? (
          <Btn variant="light" block iconRight="arrow" onClick={onStart}>{bi(startFi, startEn)}</Btn>
        ) : (
          <Btn variant="primary" block iconRight="arrow" onClick={onReview}>
            {due > 0 ? <>{bi('Kertaa', 'Review')} ({due})</> : bi('Kertaa', 'Review')}
          </Btn>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Track loaders — each builds a single-kind queue, then runs one Session       */
/* -------------------------------------------------------------------------- */
function VocabTrack({ userId, go, onExit }: { userId: string; go: (s: AppScreen) => void; onExit: () => void }) {
  const { bi } = useLang()
  const { data, loading, error } = useAsync<ReviewItem[]>(
    async () => (await fetchVocabSession(userId, SESSION_SIZE)).map((card) => ({ kind: 'word', card })),
    [userId],
  )
  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={110} />
  if (error) return <StatePane tone="error" title="Couldn't load the session" detail={error} bottom={110} />
  if (!data || data.length === 0) {
    return <EmptyTrack
      label={bi('Sanasto', 'Vocabulary')} title={bi('Ei kerrattavaa', 'Nothing due')}
      body="Your words come back here right before you'd forget them. Learn some in Day One to fill the bank."
      ctaFi="Opi sanoja" ctaEn="Learn words" onCta={() => go('dayone')} onExit={onExit} />
  }
  return <Session key={data.map((it) => it.card.cardId).join(',')} items={data} userId={userId}
    titleFi="Sanasto" titleEn="Vocabulary" go={go} onExit={onExit} />
}

function SentenceTrack({ userId, go, onExit }: { userId: string; go: (s: AppScreen) => void; onExit: () => void }) {
  const { bi } = useLang()
  const { data, loading, error } = useAsync<ReviewItem[]>(
    async () => (await fetchDueIslandRecall(userId, SESSION_SIZE)).map((card) => ({ kind: 'island', card })),
    [userId],
  )
  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={110} />
  if (error) return <StatePane tone="error" title="Couldn't load the session" detail={error} bottom={110} />
  if (!data || data.length === 0) {
    return <EmptyTrack
      label={bi('Omat lauseet', 'Your sentences')} title={bi('Ei kerrattavaa', 'Nothing due')}
      body="Build a Language Island — your own sentences come back here to review, day by day."
      ctaFi="Rakenna saari" ctaEn="Build an island" onCta={() => go('islands')} onExit={onExit} />
  }
  return <Session key={data.map((it) => it.card.cardId).join(',')} items={data} userId={userId}
    titleFi="Omat lauseet" titleEn="Your sentences" go={go} onExit={onExit} />
}

function EmptyTrack({ label, title, body, ctaFi, ctaEn, onCta, onExit }: {
  label: ReactNode; title: ReactNode; body: string
  ctaFi: string; ctaEn: string; onCta: () => void; onExit: () => void
}) {
  const { bi } = useLang()
  return (
    <ScreenScroll bottom={110}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconBtn icon="arrowL" tone="glass" size={40} onClick={onExit} />
        <Label color="var(--written)">{label}</Label>
        <span style={{ width: 40 }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', textAlign: 'center', gap: 20 }}>
        <OrbCluster size={140} />
        <div>
          <h2 className="ps-title-1">{title}</h2>
          <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10, maxWidth: 300 }}>{body}</p>
        </div>
        <Btn variant="primary" iconRight="arrow" onClick={onCta}>{bi(ctaFi, ctaEn)}</Btn>
      </div>
    </ScreenScroll>
  )
}

/* -------------------------------------------------------------------------- */
/* Session — active recall over a queue (word cards or personal sentences)      */
/* -------------------------------------------------------------------------- */
function Session({ items, userId, titleFi, titleEn, go, onExit }: {
  items: ReviewItem[]; userId: string; titleFi: string; titleEn: string
  go: (s: AppScreen) => void; onExit: () => void
}) {
  const { bi, bilingual } = useLang()
  const [i, setI] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [remembered, setRemembered] = useState(0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)

  const item = items[i]
  const card = item.card
  const previews = useMemo(() => previewIntervals(card), [card])

  const promptEn = item.kind === 'word' ? item.card.word.en : item.card.line.en
  const audioText = item.kind === 'word' ? item.card.word.fi : item.card.line.kirjaText

  const play = () => {
    setPlaying(true)
    speak(audioText) // the written (kirjakieli) form
    setTimeout(() => setPlaying(false), item.kind === 'word' ? 1100 : 1600)
  }

  const reveal = () => { setRevealed(true); play() }

  const rate = async (rating: Rating) => {
    if (busy) return
    setBusy(true); setErr('')
    try {
      await rateCard(userId, card, rating)
      if (rating >= Rating.Good) setRemembered((m) => m + 1)
      if (i < items.length - 1) { setI(i + 1); setRevealed(false) }
      else setDone(true)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  if (done) return (
    <ScreenScroll bottom={110}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', textAlign: 'center', gap: 24 }}>
        <OrbCluster size={190} />
        <div>
          <Label color="var(--written)" style={{ display: 'block', marginBottom: 10 }}>{bi('Valmis', 'Done')}</Label>
          <h2 className="ps-title-1">{bi('Hyvää työtä!', 'Good work.')}</h2>
          <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10 }}>
            {remembered} of {items.length} remembered
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="light" icon="chart" onClick={() => go('progress')}>{bi('Edistyminen', 'Progress')}</Btn>
          <Btn variant="primary" iconRight="arrow" onClick={onExit}>{bi('Takaisin', 'Back to review')}</Btn>
        </div>
      </div>
    </ScreenScroll>
  )

  return (
    <ScreenScroll bottom={110}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconBtn icon="arrowL" tone="glass" size={40} onClick={onExit} />
        <Label color={item.kind === 'island' ? 'var(--spoken)' : 'var(--written)'}>{bi(titleFi, titleEn)}</Label>
        <span style={{ width: 40 }} />
      </div>

      {/* Session progress */}
      <div style={{ marginTop: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Steps total={items.length} current={i} />
        <span className="ps-label ps-num" style={{ color: 'var(--ink-2)', flexShrink: 0 }}>{i + 1}/{items.length}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Active recall card: English is the prompt; recall + say the Finnish. */}
        <div className="ps-glass" style={{ padding: 24, borderRadius: 'var(--r-2xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Label color={item.kind === 'island' ? 'var(--spoken)' : 'var(--written)'}>{bi('Mitä on suomeksi?', 'Say it in Finnish')}</Label>
            <span className="ps-chip ps-chip--glass" style={{ fontSize: 11, padding: '5px 11px' }}>
              {card.isNew ? bi('Uusi', 'new') : bi('Kertaus', 'review')}
            </span>
          </div>

          <div style={{ marginTop: 14, fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: item.kind === 'word' ? 30 : 23, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {promptEn}
          </div>

          {revealed ? (
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--glass-edge)' }}>
              {item.kind === 'word' ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 38, letterSpacing: '-0.03em', lineHeight: 1 }}>{item.card.word.fi}</div>
                    {item.card.word.ipa && (
                      <div className="ps-num" style={{ marginTop: 6, fontSize: 16, color: 'var(--written)', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' }}>
                        {item.card.word.ipa}
                      </div>
                    )}
                  </div>
                  <SpeakerBtn reg="kirja" playing={playing} onClick={play} size={48} />
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <RegDot reg="kirja" />
                      <div style={{ marginTop: 7 }}>
                        <Sentence tokens={item.card.line.kirja} font="var(--font-display)" weight={600} size={22} color="var(--ink)" />
                      </div>
                    </div>
                    <SpeakerBtn reg="kirja" playing={playing} onClick={play} size={44} />
                  </div>
                  {item.card.line.puheText && (
                    <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--spoken-bg)', border: '1px solid var(--spoken-line)', borderRadius: 'var(--r-md)' }}>
                      <RegDot reg="puhe" />
                      <div style={{ marginTop: 7 }}>
                        <Sentence tokens={item.card.line.puhe} font="var(--font-body)" weight={600} size={16} color="var(--ink)" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="ps-caption" style={{ marginTop: 14 }}>{bi('Sano se ääneen, sitten näytä vastaus', 'Say it aloud, then reveal the answer')}</div>
          )}
        </div>

        {err && (
          <div className="ps-body" style={{ marginTop: 12, padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--flag-bg)', color: 'var(--flag)' }}>
            {err}
          </div>
        )}

        <div style={{ flex: 1, minHeight: 16 }} />

        {!revealed ? (
          <Btn variant="primary" block iconRight="arrow" onClick={reveal}>{bi('Näytä vastaus', 'Show answer')}</Btn>
        ) : (
          <>
            <div className="ps-label" style={{ color: 'var(--ink-3)', textAlign: 'center', marginBottom: 10 }}>
              {bi('Kuinka hyvin muistit?', 'How well did you recall it?')}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {RATINGS.map(({ rating, fi, en, color, bg }) => (
                <button key={rating} disabled={busy} onClick={() => void rate(rating)} className="ps-press"
                  aria-label={en}
                  style={{
                    flex: 1, padding: '12px 4px', borderRadius: 'var(--r-md)', cursor: busy ? 'default' : 'pointer',
                    border: `1.5px solid ${color}`, background: bg, color,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    opacity: busy ? 0.55 : 1, transition: 'opacity .15s',
                  }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>{fi}</span>
                  {bilingual && <span style={{ fontSize: 9, fontWeight: 400, fontStyle: 'italic', opacity: 0.65 }}>({en})</span>}
                  <span className="ps-num" style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}>{previews[rating]}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </ScreenScroll>
  )
}
