import { useState, useMemo } from 'react'
import { Orb, OrbCluster, Label } from '../components/primitives'
import { Btn, IconBtn, Bar } from '../components/ui'
import { I } from '../components/icons'
import { ScreenScroll, AppScreen } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { fetchSprintWords, fetchNextWords, SprintWord } from '../lib/data/content'
import { recordWordEncounter } from '../lib/data/cards'
import { useProgress } from '../lib/data/progress'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'

// Orb gradient pairs cycled per card (the DB carries no presentation colour).
const ORB_PALETTE: [string, string][] = [
  ['var(--orb-magenta)', 'var(--orb-pink)'],
  ['var(--orb-violet)',  'var(--orb-magenta)'],
  ['var(--orb-deep)',    'var(--orb-violet)'],
  ['var(--orb-pink)',    '#7FC6D8'],
  ['var(--orb-magenta)', 'var(--orb-violet)'],
]

// Set sizes the learner can pick. Capped to however many words actually exist.
const SIZES = [50, 100, 150]

// Saved progress, per user, in this browser: which set, and how far in.
type Saved = { size: number; idx: number }

export function DayOne({ go }: { go: (s: AppScreen) => void }) {
  const { data: words, loading, error } = useAsync<SprintWord[]>(fetchSprintWords, [])

  if (loading) return <StatePane title="Ladataan sanoja…" />
  if (error) return <StatePane tone="error" title="Sanojen lataus epäonnistui" detail={error} />
  if (!words || words.length === 0) return <StatePane title="Ei sanoja vielä" detail="No sprint words available yet." />

  return <SprintFlow words={words} go={go} />
}

type RunSession = { deck: SprintWord[]; startIdx: number; mode: 'initial' | 'daily'; size: number }

function SprintFlow({ words, go }: { words: SprintWord[]; go: (s: AppScreen) => void }) {
  const maxWords = words.length
  const { progress, saveSprint } = useProgress()
  const { user } = useAuth()

  // Resume offer (in-progress initial set) from cross-device progress.
  const s = progress.sprint
  const resumable: Saved | null = (s && !s.completed && s.idx > 0 && s.idx < s.size)
    ? { size: Math.min(s.size, maxWords), idx: Math.min(s.idx, Math.min(s.size, maxWords)) }
    : null

  // Auto-resume an in-progress set at mount, so the learner picks up exactly
  // where they stopped. (App gates rendering on progress being resolved.)
  const [session, setSession] = useState<RunSession | null>(
    () => resumable
      ? { deck: words.slice(0, resumable.size), startIdx: Math.min(resumable.idx, resumable.size - 1), mode: 'initial', size: resumable.size }
      : null,
  )
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  // The full set is always offered; smaller picks only if there's room for them.
  const sizeOptions = useMemo(() => {
    const opts = SIZES.filter((n) => n < maxWords)
    opts.push(maxWords)
    return Array.from(new Set(opts)).sort((a, b) => a - b)
  }, [maxWords])

  const startInitial = (size: number) => {
    saveSprint({ size, idx: 0, completed: false })
    setSession({ deck: words.slice(0, size), startIdx: 0, mode: 'initial', size })
  }
  const resume = () => {
    if (resumable) setSession({ deck: words.slice(0, resumable.size), startIdx: Math.min(resumable.idx, resumable.size - 1), mode: 'initial', size: resumable.size })
  }
  // Daily intake: fetch the next N words the learner hasn't met, then run them.
  const startDaily = async (n: number) => {
    if (!user || loading) return
    setLoading(true); setErr('')
    try {
      const deck = await fetchNextWords(user.id, n)
      if (deck.length === 0) { setErr('No new words available right now — you have met them all.'); setLoading(false); return }
      setSession({ deck, startIdx: 0, mode: 'daily', size: deck.length })
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e)); setLoading(false)
    }
  }

  if (session) {
    return (
      <SprintRunner
        key={session.mode + ':' + session.size + ':' + session.startIdx}
        deck={session.deck}
        startIdx={session.startIdx}
        onAdvance={session.mode === 'initial'
          ? (idx) => saveSprint({ size: session.size, idx, completed: idx >= session.size })
          : () => { /* daily batch: no resume state — met words are skipped next time */ }}
        onRestart={() => setSession(null)}
        go={go}
      />
    )
  }

  // No active session: once the initial set is done, Day One becomes the daily
  // intake; before that, it's the first-set picker (with resume).
  if (progress.sprint?.completed) {
    return <DailyStart onLearn={startDaily} loading={loading} err={err} go={go} />
  }
  return <Start sizeOptions={sizeOptions} saved={resumable} onPick={startInitial} onContinue={resume} go={go} />
}

/* -------------------------------------------------------------------------- */
/* Daily intake — learn the next most-useful words you haven't met yet        */
/* -------------------------------------------------------------------------- */
function DailyStart({ onLearn, loading, err, go }: {
  onLearn: (n: number) => void
  loading: boolean
  err: string
  go: (s: AppScreen) => void
}) {
  const { bi } = useLang()
  const OPTIONS = [10, 15, 30]
  return (
    <ScreenScroll bottom={110}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconBtn icon="close" tone="glass" size={40} onClick={() => go('daily')} />
        <Label color="var(--written)">{bi('Sanasto', 'Vocabulary')}</Label>
        <span style={{ width: 40 }} />
      </div>

      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}><OrbCluster size={112} /></div>
        <h1 className="ps-title-1" style={{ marginTop: 12 }}>{bi('Uudet sanat', 'New words')}</h1>
        <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 8, maxWidth: 300, marginInline: 'auto' }}>
          Add the next most useful Finnish words to your bank. A little every day is how it grows.
        </p>
      </div>

      {err && (
        <div className="ps-body" style={{ marginTop: 16, padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--flag-bg)', color: 'var(--flag)' }}>{err}</div>
      )}

      <div style={{ marginTop: 22 }}>
        <Label color="var(--ink-3)" style={{ marginLeft: 2 }}>{bi('Montako tänään?', 'How many today?')}</Label>
        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          {OPTIONS.map((n) => (
            <button key={n} className="ps-press ps-card" disabled={loading} onClick={() => onLearn(n)} style={{
              padding: '18px 20px', cursor: loading ? 'default' : 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, opacity: loading ? 0.6 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, letterSpacing: '-0.03em' }}>{n}</span>
                <span className="ps-caption">{bi('uutta sanaa', 'new words')}</span>
              </div>
              <span style={{ color: 'var(--written)' }}><I name="arrow" size={20} /></span>
            </button>
          ))}
        </div>
        <div className="ps-caption" style={{ textAlign: 'center', marginTop: 14 }}>
          {loading ? bi('Haetaan…', 'Loading…') : bi('Kertaa opitut Kertaus-välilehdellä', 'Review what you have learned in the Review tab')}
        </div>
      </div>
    </ScreenScroll>
  )
}

/* -------------------------------------------------------------------------- */
/* Start screen — choose a set, or continue where you left off                */
/* -------------------------------------------------------------------------- */
function Start({ sizeOptions, saved, onPick, onContinue, go }: {
  sizeOptions: number[]
  saved: Saved | null
  onPick: (size: number) => void
  onContinue: () => void
  go: (s: AppScreen) => void
}) {
  const { bi } = useLang()
  return (
    <ScreenScroll>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconBtn icon="close" tone="glass" size={40} onClick={() => go('daily')} />
        <Label color="var(--written)">{bi('Päivä yksi', 'Day One')}</Label>
        <span style={{ width: 40 }} />
      </div>

      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}><OrbCluster size={112} /></div>
        <h1 className="ps-title-1" style={{ marginTop: 12 }}>{bi('Aloitusryntäys', 'Day One Sprint')}</h1>
        <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 8, maxWidth: 300, marginInline: 'auto' }}>
          Recognise the most frequent Finnish words. See it, hear it, tap the meaning. Pick how many to start with, and you can continue where you left off.
        </p>
      </div>

      {saved && (
        <button className="ps-press ps-glass" onClick={onContinue} style={{
          marginTop: 22, padding: 18, textAlign: 'left', border: '1px solid var(--written-line)',
          background: 'var(--written-bg)', cursor: 'pointer', width: '100%',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Label color="var(--written)">{bi('Jatka', 'Continue')}</Label>
            <span className="ps-label ps-num" style={{ color: 'var(--ink-2)' }}>{saved.idx} / {saved.size}</span>
          </div>
          <div style={{ marginTop: 10 }}>
            <Bar value={(saved.idx / saved.size) * 100} color="var(--written)" />
          </div>
        </button>
      )}

      <div style={{ marginTop: 22 }}>
        <Label color="var(--ink-3)" style={{ marginLeft: 2 }}>{bi('Valitse setti', 'Choose your set')}</Label>
        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          {sizeOptions.map((n) => (
            <button key={n} className="ps-press ps-card" onClick={() => onPick(n)} style={{
              padding: '18px 20px', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, letterSpacing: '-0.03em' }}>{n}</span>
                <span className="ps-caption">{bi('sanaa', 'words')}</span>
              </div>
              <span style={{ color: 'var(--written)' }}><I name="arrow" size={20} /></span>
            </button>
          ))}
        </div>
      </div>
    </ScreenScroll>
  )
}

/* -------------------------------------------------------------------------- */
/* The running sprint — card → quick recognition quiz, per word               */
/* -------------------------------------------------------------------------- */
function SprintRunner({ deck, startIdx, onAdvance, onRestart, go }: {
  deck: SprintWord[]
  startIdx: number
  onAdvance: (idx: number) => void
  onRestart: () => void
  go: (s: AppScreen) => void
}) {
  const { bi } = useLang()
  const { user } = useAuth()
  const total = deck.length
  const [idx, setIdx] = useState(Math.max(0, Math.min(startIdx, total - 1)))
  const [phase, setPhase] = useState<'card' | 'quiz'>('card')
  const [picked, setPicked] = useState<string | null>(null)
  const [mastered, setMastered] = useState(Math.max(0, Math.min(startIdx, total)))
  const [done, setDone] = useState(false)

  const w = deck[idx]
  const orb = ORB_PALETTE[idx % ORB_PALETTE.length]
  const wave = Math.min(8, Math.floor((mastered / total) * 8) + 1)

  const options = useMemo(() => {
    const pool = deck.filter((x) => x.en !== w.en)
    const picks = new Set<string>()
    let k = 0
    while (picks.size < 3 && k < pool.length * 2 && pool.length > 0) {
      picks.add(pool[(idx * 7 + k) % pool.length].en)
      k++
    }
    return [w.en, ...picks].sort((a, b) => ((a.length + idx) % 3) - ((b.length + idx) % 3))
  }, [idx, deck, w.en])

  const next = () => {
    // The learner just met this word: enter it into the spaced-repetition
    // scheduler (a miss seeds 'Again' so it returns sooner). Fire-and-forget.
    if (user) void recordWordEncounter(user.id, w.id, picked === w.en)
    const nx = idx + 1
    setMastered((m) => Math.min(total, m + 1))
    if (nx >= total) {
      onAdvance(total) // mark the set complete
      setDone(true)
      return
    }
    onAdvance(nx)
    setPicked(null)
    setPhase('card')
    setIdx(nx)
  }

  if (done) {
    return (
      <ScreenScroll bottom={110}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          alignItems: 'center', textAlign: 'center', gap: 24 }}>
          <OrbCluster size={190} />
          <div>
            <Label color="var(--written)" style={{ display: 'block', marginBottom: 10 }}>{bi('Ryntäys valmis', 'Sprint complete')}</Label>
            <h2 className="ps-title-1">{bi('Hyvää työtä!', 'Great work!')}</h2>
            <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10, maxWidth: 300 }}>
              You recognised {total} words. Next: turn them into lasting memory with daily review.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
            <Btn variant="primary" block icon="cards" onClick={() => go('daily')}>{bi('Aloita kertaus', 'Start daily review')}</Btn>
            <Btn variant="light" block onClick={onRestart}>{bi('Valitse toinen setti', 'Choose another set')}</Btn>
          </div>
        </div>
      </ScreenScroll>
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <ScreenScroll bottom={110}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconBtn icon="close" tone="glass" size={40} onClick={() => go('daily')} />
          <Label color="var(--written)">{`Day One · Wave ${wave} / 8`}</Label>
          <span className="ps-label ps-num" style={{ color: 'var(--ink)' }}>{mastered}/{total}</span>
        </div>

        {/* Gradient progress bar */}
        <div style={{ marginTop: 12, height: 7, borderRadius: 999, background: 'var(--glass-deep)', overflow: 'hidden' }}>
          <div style={{
            width: `${(mastered / total) * 100}%`, height: '100%', borderRadius: 999,
            background: 'linear-gradient(90deg, var(--written), var(--spoken))',
            transition: 'width .5s',
          }} />
        </div>

        {phase === 'card' ? (
          <div key={'card' + idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: 22 }}>
            <div className="ps-glass" style={{ padding: 0, overflow: 'hidden', flexShrink: 0, borderRadius: 'var(--r-2xl)' }}>
              {/* Orb hero panel */}
              <div style={{
                height: 132, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'radial-gradient(120% 90% at 70% 20%, rgba(255,255,255,.5), transparent), var(--lav-tint)',
              }}>
                <div style={{ position: 'absolute', top: 14, left: 16 }}>
                  <Label color="var(--written)">{bi('Sana', 'word')}</Label>
                </div>
                <OrbCluster size={96} />
              </div>

              {/* Word info */}
              <div style={{ padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 44, lineHeight: 1, letterSpacing: '-0.04em' }}>{w.fi}</div>
                </div>
                {w.ipa && (
                  <div className="ps-num" style={{ marginTop: 8, fontSize: 18, color: 'var(--written)', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' }}>
                    {w.ipa}
                  </div>
                )}
                <div className="ps-body-l" style={{ marginTop: 8, color: 'var(--ink-2)' }}>"{w.en}"</div>

                {/* Register mini row */}
                <div style={{
                  marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                  paddingTop: 16, borderTop: '1px solid var(--glass-edge)',
                }}>
                  <span className="ps-label" style={{ color: 'var(--written)' }}>Kirja</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>{w.fi}</span>
                  <span style={{ color: 'var(--ink-3)' }}><I name="arrow" size={15} /></span>
                  <span className="ps-label" style={{ color: 'var(--spoken)' }}>Puhe</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15 }}>{w.fi}</span>
                  <span className="ps-caption">· sama</span>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 14 }} />
            <Btn variant="primary" block iconRight="arrow" onClick={() => setPhase('quiz')}>{bi('Testaa minua', 'Test me')}</Btn>
          </div>
        ) : (
          <div key={'quiz' + idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: 22 }}>
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <Label color="var(--ink-3)">{bi('Tunnista', 'Recognise')}</Label>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '18px 0 8px' }}>
                <Orb size={76} from={orb[0]} to={orb[1]} />
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 46, lineHeight: 1.05, letterSpacing: '-0.04em' }}>{w.fi}</div>
              <div className="ps-caption" style={{ marginTop: 6 }}>{bi('Mitä tämä tarkoittaa?', 'What does this mean?')}</div>
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ display: 'grid', gap: 10 }}>
              {options.map((opt) => {
                const correct = opt === w.en, chosen = picked === opt
                let bg = 'var(--glass-2)', bd = 'var(--glass-line)', col = 'var(--ink)'
                if (picked) {
                  if (correct) { bg = 'rgba(107,70,193,.12)'; bd = 'var(--written)'; col = 'var(--written)' }
                  else if (chosen) { bg = 'var(--flag-bg)'; bd = 'var(--flag)'; col = 'var(--flag)' }
                }
                return (
                  <button key={opt} disabled={!!picked} onClick={() => setPicked(opt)} className="ps-press" style={{
                    textAlign: 'left', padding: '16px 20px', borderRadius: 'var(--r-md)',
                    cursor: picked ? 'default' : 'pointer', border: `1.5px solid ${bd}`,
                    background: bg, color: col, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    {opt}
                    {picked && correct && <I name="check" size={20} />}
                    {picked && chosen && !correct && <I name="close" size={20} />}
                  </button>
                )
              })}
            </div>

            <div style={{ marginTop: 14, minHeight: 54 }}>
              {picked && (
                <Btn variant={picked === w.en ? 'accent' : 'primary'} block iconRight="arrow" onClick={next}>
                  {picked === w.en ? bi('Hienoa!', 'Great, continue') : bi('Jatka', 'Continue')}
                </Btn>
              )}
            </div>
          </div>
        )}
      </ScreenScroll>
    </div>
  )
}
