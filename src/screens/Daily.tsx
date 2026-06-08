import { useMemo, useState } from 'react'
import { OrbCluster, Label } from '../components/primitives'
import { Btn, Steps, SpeakerBtn } from '../components/ui'
import { ScreenScroll, AppScreen } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'
import { fetchVocabSession, rateCard, previewIntervals, VocabCard } from '../lib/data/cards'
import { Rating } from '../lib/fsrs/types'
import { speak } from '../lib/tts'

const SESSION_SIZE = 12

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
  const { data: cards, loading, error } = useAsync<VocabCard[]>(
    () => (user ? fetchVocabSession(user.id, SESSION_SIZE) : Promise.resolve([])),
    [user?.id],
  )

  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={110} />
  if (error) return <StatePane tone="error" title="Couldn't load the session" detail={error} bottom={110} />
  if (!user) return <StatePane title={bi('Kirjaudu sisään', 'Sign in')} detail="Sign in to start your review session." bottom={110} />

  // Empty review = you haven't met any words yet (or none are due). Send the
  // learner to the Day One Sprint, which is what fills the scheduler — never
  // dummy content the learner has never seen.
  if (!cards || cards.length === 0) {
    return (
      <ScreenScroll bottom={110}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          alignItems: 'center', textAlign: 'center', gap: 22 }}>
          <OrbCluster size={150} />
          <div>
            <Label color="var(--written)" style={{ display: 'block', marginBottom: 8 }}>{bi('Kertaus', 'Review')}</Label>
            <h2 className="ps-title-1">{bi('Ei kerrattavaa vielä', 'Nothing to review yet')}</h2>
            <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10, maxWidth: 300 }}>
              Your daily review fills with the words you meet in the Day One Sprint. Do a sprint to add some, then they come back here right before you would forget them.
            </p>
          </div>
          <Btn variant="primary" icon="sparkle" onClick={() => go('dayone')}>{bi('Aloitusryntäys', 'Day One Sprint')}</Btn>
        </div>
      </ScreenScroll>
    )
  }

  // Keyed on the loaded set so a fresh queue resets the session cleanly.
  return <Session key={cards.map((c) => c.cardId).join(',')} cards={cards} userId={user.id} go={go} />
}

function Session({ cards, userId, go }: { cards: VocabCard[]; userId: string; go: (s: AppScreen) => void }) {
  const { bi, bilingual } = useLang()
  const [i, setI] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [remembered, setRemembered] = useState(0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)

  const card = cards[i]
  const previews = useMemo(() => previewIntervals(card), [card])

  const play = () => {
    setPlaying(true)
    speak(card.word.fi) // the written (kirjakieli) form
    setTimeout(() => setPlaying(false), 1100)
  }

  const reveal = () => {
    setRevealed(true)
    play()
  }

  const rate = async (rating: Rating) => {
    if (busy) return
    setBusy(true); setErr('')
    try {
      await rateCard(userId, card, rating)
      if (rating >= Rating.Good) setRemembered((m) => m + 1)
      if (i < cards.length - 1) { setI(i + 1); setRevealed(false) }
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
            {remembered} of {cards.length} remembered
          </p>
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
          <Label color="var(--written)">{bi('Päivän kertaus', 'daily review')}</Label>
          <h1 className="ps-title-1" style={{ marginTop: 8 }}>{bi('Kertaus', 'Review')}</h1>
        </div>
      </div>

      {/* Session progress */}
      <div style={{ marginTop: 18, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Steps total={cards.length} current={i} />
        <span className="ps-label" style={{ color: 'var(--ink-2)', flexShrink: 0 }}>{i + 1}/{cards.length}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Active recall card: English meaning is the prompt; recall the Finnish. */}
        <div className="ps-glass" style={{ padding: 24, borderRadius: 'var(--r-2xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Label color="var(--written)">{bi('Mitä on suomeksi?', 'Say it in Finnish')}</Label>
            <span className="ps-chip ps-chip--glass" style={{ fontSize: 11, padding: '5px 11px' }}>
              {card.isNew ? bi('Uusi', 'new') : bi('Kertaus', 'review')}
            </span>
          </div>

          <div style={{ marginTop: 14, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30,
            letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {card.word.en}
          </div>

          {revealed ? (
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--glass-edge)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 38, letterSpacing: '-0.03em', lineHeight: 1 }}>{card.word.fi}</div>
                {card.word.ipa && (
                  <div className="ps-num" style={{ marginTop: 6, fontSize: 16, color: 'var(--written)', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' }}>
                    {card.word.ipa}
                  </div>
                )}
              </div>
              <SpeakerBtn reg="kirja" playing={playing} onClick={play} size={48} />
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
