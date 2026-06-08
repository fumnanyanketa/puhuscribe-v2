import { useMemo, useState } from 'react'
import { OrbCluster, Label } from '../components/primitives'
import { RegisterCard } from '../components/RegisterCard'
import { Btn, Steps } from '../components/ui'
import { I } from '../components/icons'
import { ScreenScroll, AppScreen } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'
import { fetchDailySession, rateCard, previewIntervals, SessionCard } from '../lib/data/cards'
import { Rating } from '../lib/fsrs/types'
import { speak } from '../lib/tts'

const SESSION_SIZE = 8

// Rating buttons: Again/Hard/Good/Easy, each tinted with a brand token and
// showing the FSRS-computed next interval underneath.
const RATINGS: { rating: Rating; fi: string; en: string; color: string; bg: string }[] = [
  { rating: Rating.Again, fi: 'Taas',   en: 'again', color: 'var(--flag)',    bg: 'var(--flag-bg)' },
  { rating: Rating.Hard,  fi: 'Vaikea', en: 'hard',  color: 'var(--ink-2)',   bg: 'var(--glass-2)' },
  { rating: Rating.Good,  fi: 'Hyvä',   en: 'good',  color: 'var(--written)', bg: 'rgba(107,70,193,.12)' },
  { rating: Rating.Easy,  fi: 'Helppo', en: 'easy',  color: 'var(--spoken)',  bg: 'var(--spoken-bg)' },
]

export function Daily({ go }: { go: (s: AppScreen) => void }) {
  const { user } = useAuth()
  const { bi } = useLang()
  const { data: cards, loading, error } = useAsync<SessionCard[]>(
    () => (user ? fetchDailySession(user.id, SESSION_SIZE) : Promise.resolve([])),
    [user?.id],
  )

  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={110} />
  if (error) return <StatePane tone="error" title="Couldn't load the session" detail={error} bottom={110} />
  if (!user) return <StatePane title={bi('Kirjaudu sisään', 'Sign in')} detail="Sign in to start your review session." bottom={110} />
  if (!cards || cards.length === 0)
    return <StatePane title={bi('Ei kortteja juuri nyt', 'No cards right now')} detail="No cards due right now — great work. Come back later." bottom={110} />

  // Keyed on the loaded set so a fresh queue resets the session cleanly.
  return <Session key={cards.map((c) => c.cardId).join(',')} cards={cards} userId={user.id} go={go} />
}

function Session({ cards, userId, go }: { cards: SessionCard[]; userId: string; go: (s: AppScreen) => void }) {
  const { bi, bilingual } = useLang()
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState<'kirja' | 'puhe' | null>(null)
  const [remembered, setRemembered] = useState(0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)

  const card = cards[i]
  const previews = useMemo(() => previewIntervals(card), [card])

  const play = (reg: 'kirja' | 'puhe') => {
    setPlaying(reg)
    speak(card.sentence.kirja.map((t) => t.t).join(' ')) // kirjakieli audio for both registers
    setTimeout(() => setPlaying(null), 1100)
  }

  const rate = async (rating: Rating) => {
    if (busy) return
    setBusy(true); setErr('')
    try {
      await rateCard(userId, card, rating)
      if (rating >= Rating.Good) setRemembered((m) => m + 1)
      if (i < cards.length - 1) setI(i + 1)
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
          <Label color="var(--written)" style={{ display: 'block', marginBottom: 10 }}>{bi('Sessio valmis', 'Session complete')}</Label>
          <h2 className="ps-title-1">{bi('Hyvää työtä!', 'Good work.')}</h2>
          <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10 }}>
            {cards.length} cards reviewed · {remembered} remembered
          </p>
        </div>
        <div className="ps-glass" style={{ padding: '18px 24px', display: 'flex', gap: 28 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, lineHeight: 1, letterSpacing: '-0.03em' }}>{remembered}</div>
            <div className="ps-caption" style={{ marginTop: 4 }}>remembered</div>
          </div>
          <div style={{ width: 1, background: 'var(--glass-edge)' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, lineHeight: 1, color: 'var(--spoken)', letterSpacing: '-0.03em' }}>{cards.length}</div>
            <div className="ps-caption" style={{ marginTop: 4 }}>reviewed</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="light" onClick={() => go('island')}>{bi('Kielisaari', 'Island')}</Btn>
          <Btn variant="primary" icon="chart" onClick={() => go('progress')}>{bi('Edistyminen', 'Progress')}</Btn>
        </div>
      </div>
    </ScreenScroll>
  )

  return (
    <ScreenScroll bottom={110}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <Label color="var(--written)">{bi('Päivän sessio', 'spaced repetition')}</Label>
          <h1 className="ps-title-1" style={{ marginTop: 8 }}>{bi('Kertaus', 'Review')}</h1>
        </div>
      </div>

      {/* Session progress */}
      <div style={{ marginTop: 18, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Steps total={cards.length} current={i} />
        <span className="ps-label" style={{ color: 'var(--ink-2)', flexShrink: 0 }}>{i + 1}/{cards.length}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <RegisterCard key={card.cardId} glass onPlay={play} playing={playing}
          gloss={card.sentence.gloss} kirja={card.sentence.kirja} puhe={card.sentence.puhe}
          badge={card.isNew ? bi('Uusi', 'new') : bi('Kertaus', 'review')} />

        <div className="ps-caption" style={{ textAlign: 'center', marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
          <I name="speaker" size={15} /> Tap a register to hear it
        </div>

        {err && (
          <div className="ps-body" style={{ marginTop: 12, padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--flag-bg)', color: 'var(--flag)' }}>
            {err}
          </div>
        )}

        <div style={{ flex: 1, minHeight: 16 }} />

        {/* Recall rating — FSRS schedules the next review */}
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
              {bilingual && <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.7 }}>{en}</span>}
              <span className="ps-num" style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}>{previews[rating]}</span>
            </button>
          ))}
        </div>
      </div>
    </ScreenScroll>
  )
}
