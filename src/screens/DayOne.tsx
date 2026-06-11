import { useState, useMemo, useEffect } from 'react'
import { BrandMark } from '../components/primitives'
import { Bar, Ring, SpeakerBtn } from '../components/ui'
import { I } from '../components/icons'
import { ExBar, CenterLabel, Counter, CTA, Eyebrow, Gloss, IconTile, OptionRow, StackLabel } from '../components/kit'
import { ScreenScroll, AppScreen } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { fetchSprintWords, SprintWord } from '../lib/data/content'
import { recordWordEncounter } from '../lib/data/cards'
import { useProgress } from '../lib/data/progress'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'
import { speak } from '../lib/tts'
import { useStudyClock } from '../lib/studyTime'

/* ---------------------------------------------------------------------------
 * Day One = the 150-word vocabulary sprint, nothing else (owner decision:
 * no size pickers; the recurring 15-a-day intake lives on the Learn tab).
 * New users land here straight after onboarding; an in-flight sprint
 * auto-resumes; Home carries the resume card for returning users.
 * ------------------------------------------------------------------------- */

export const SPRINT_CAP = 150

export function DayOne({ go }: { go: (s: AppScreen) => void }) {
  const { data: words, loading, error } = useAsync<SprintWord[]>(() => fetchSprintWords(SPRINT_CAP), [])

  if (loading) return <StatePane title="Ladataan sanoja…" />
  if (error) return <StatePane tone="error" title="Sanojen lataus epäonnistui" detail={error} />
  if (!words || words.length === 0) return <StatePane title="Ei sanoja vielä" detail="No sprint words available yet." />

  return <SprintFlow words={words} go={go} />
}

function SprintFlow({ words, go }: { words: SprintWord[]; go: (s: AppScreen) => void }) {
  const { progress, saveSprint } = useProgress()
  // There is only one sprint length now (SPRINT_CAP). Ignore any stale `size`
  // left by the old set-size picker (e.g. 50) — only the saved idx is used for
  // resume below, so an old record self-heals to 150 on the next save.
  const size = Math.min(SPRINT_CAP, words.length)

  // Once the sprint exists (started anywhere, even at word 0) we go straight
  // to the runner; the intro is a one-time takeover for brand-new users.
  const s = progress.sprint
  const inFlight = Boolean(s && !s.completed)
  const startIdx = inFlight ? Math.min(s!.idx, size - 1) : 0
  const [running, setRunning] = useState(inFlight)

  // Cross-device progress can resolve after mount; enter the runner when an
  // in-flight sprint appears. Never auto-exit (the finished pane stays up).
  useEffect(() => {
    if (inFlight && !running) setRunning(true)
  }, [inFlight, running])

  if (running) {
    return (
      <SprintRunner
        deck={words.slice(0, size)}
        startIdx={startIdx}
        labelFor={(wave) => ({ fi: `DAY ONE · WAVE ${wave} / 8` })}
        onAdvance={(idx) => saveSprint({ size, idx, completed: idx >= size })}
        onExit={() => go('home')}
        done={{
          labelFi: 'SPRINTTI VALMIS', labelEn: 'Sprint complete',
          body: `You recognised ${size} words. Next: make them yours with daily review, and start building sentences from your own life.`,
          primaryFi: 'Rakenna lausepankkia', primaryEn: 'Build your sentence bank', onPrimary: () => go('islands'),
          secondaryFi: 'Kotiin', secondaryEn: 'Home', onSecondary: () => go('home'),
        }}
      />
    )
  }

  return (
    <SprintIntro
      total={size}
      onStart={() => { saveSprint({ size, idx: 0, completed: false }); setRunning(true) }}
      onClose={() => go('home')}
    />
  )
}

/* =====================================================================
   SPRINT INTRO — Day One first-run takeover
   ===================================================================== */
const SPRINT_STEPS = [
  { icon: 'eye',    fi: 'Näe sana',            en: 'See the word' },
  { icon: 'volume', fi: 'Kuule se',            en: 'Hear it said' },
  { icon: 'check',  fi: 'Tunnista merkitys',   en: 'Recognise the meaning' },
]

export function SprintIntro({ total, onStart, onClose, embedded = false }: {
  total: number
  onStart: () => void
  onClose?: () => void
  embedded?: boolean // rendered inside the Learn tab (tab bar visible, no close)
}) {
  const { bilingual } = useLang()
  return (
    <ScreenScroll pad={24} bottom={embedded ? 96 : 26}>
      {!embedded && <ExBar nav="close" onNav={onClose} center={<CenterLabel fi="PÄIVÄ YKSI" en="Day one" />} />}
      <div style={{ marginTop: embedded ? 6 : 22 }}>
        <Eyebrow fi="SANASTOSPRINTTI" en="Vocabulary sprint" color="var(--written)" style={{ marginBottom: 12 }} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 27.4, lineHeight: 0.98,
          letterSpacing: '-0.035em', color: 'var(--ink)', margin: 0 }}>Ensimmäiset {total} sanaa</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14.9, lineHeight: 1.5,
          color: 'var(--ink-2)', margin: '14px 0 0', textWrap: 'pretty' }}>
          The Day One sprint walks you through the {total} most common Finnish words, enough to start
          recognising the language around you. Do it in one go or a few short sittings; it saves as you go.
        </p>
      </div>

      {/* Goal card with ring */}
      <div className="ps-card" style={{ marginTop: 20, padding: 22, borderRadius: 'var(--r-xl)',
        display: 'flex', alignItems: 'center', gap: 20 }}>
        <Ring value={0} max={total} size={96} stroke={11} color="var(--written)" track="var(--glass-deep)">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20.3,
              letterSpacing: '-0.03em', color: 'var(--ink)', lineHeight: 1 }}>0</div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>/ {total}</div>
          </div>
        </Ring>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.5, color: 'var(--ink)' }}>
            Tunnista {total} sanaa
          </div>
          <Gloss>Recognise {total} words</Gloss>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13.5, lineHeight: 1.4,
            color: 'var(--ink-2)', margin: '8px 0 0' }}>
            Etenet aalloittain. Edistymisesi tallentuu.{' '}
            {bilingual && <span style={{ color: 'var(--ink-3)' }}>In waves. Your progress saves.</span>}
          </p>
        </div>
      </div>

      {/* How it works */}
      <Eyebrow fi="NÄIN SE TOIMII" en="How it works" color="var(--ink-3)" style={{ marginTop: 24, marginBottom: 14 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SPRINT_STEPS.map((st, i) => (
          <div key={st.icon} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <IconTile icon={st.icon} size={44} r={13} color="var(--written)" bg="var(--written-bg)" />
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.3, color: 'var(--ink)' }}>{st.fi}</span>
              {bilingual && (
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-3)', display: 'block', marginTop: 1 }}>{st.en}</span>
              )}
            </div>
            <span className="ps-num" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.9, color: 'var(--ink-3)' }}>{i + 1}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 22 }} />
      <CTA fi="Aloita sprintti" en="Start the sprint" icon="sparkle" variant="ink" onClick={onStart} />
      {onClose && !embedded && (
        <button className="ps-press" onClick={onClose} style={{ marginTop: 12, width: '100%',
          background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 0' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14.5, color: 'var(--ink-2)' }}>
            Tutustun sovellukseen ensin{' '}
            {bilingual && <span style={{ fontWeight: 500, color: 'var(--ink-3)' }}>Explore the app first, and pick this up anytime</span>}
          </span>
        </button>
      )}
    </ScreenScroll>
  )
}

/* =====================================================================
   SPRINT RUNNER — word card → recognise quiz, per word. Shared by the
   Day One sprint and the daily 15-word intake (Learn tab).
   ===================================================================== */
export interface RunnerDone {
  labelFi: string; labelEn: string
  body: string
  primaryFi: string; primaryEn: string; onPrimary: () => void
  secondaryFi?: string; secondaryEn?: string; onSecondary?: () => void
}

export function SprintRunner({ deck, startIdx, labelFor, onAdvance, onExit, done }: {
  deck: SprintWord[]
  startIdx: number
  labelFor: (wave: number) => { fi: string; en?: string }
  onAdvance: (idx: number) => void
  onExit: () => void
  done: RunnerDone
}) {
  const { bilingual } = useLang()
  const { user } = useAuth()
  useStudyClock()
  const total = deck.length
  const [idx, setIdx] = useState(Math.max(0, Math.min(startIdx, total - 1)))
  const [phase, setPhase] = useState<'card' | 'quiz'>('card')
  const [picked, setPicked] = useState<string | null>(null)
  const [mastered, setMastered] = useState(Math.max(0, Math.min(startIdx, total)))
  const [finished, setFinished] = useState(false)
  const [playing, setPlaying] = useState(false)

  const w = deck[idx]
  const wave = Math.min(8, Math.floor((mastered / total) * 8) + 1)
  const label = labelFor(wave)

  const play = () => {
    setPlaying(true)
    speak(w.fi)
    setTimeout(() => setPlaying(false), 1000)
  }

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
    if (user) void recordWordEncounter(user.id, w.id, picked === w.en)
    const nx = idx + 1
    setMastered((m) => Math.min(total, m + 1))
    if (nx >= total) {
      onAdvance(total)
      setFinished(true)
      return
    }
    onAdvance(nx)
    setPicked(null)
    setPhase('card')
    setIdx(nx)
  }

  if (finished) {
    return (
      <ScreenScroll bottom={26}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          alignItems: 'center', textAlign: 'center', gap: 24 }}>
          <BrandMark size={140} />
          <div>
            <StackLabel fi={done.labelFi} en={done.labelEn} color="var(--written)" style={{ marginBottom: 10 }} />
            <h2 className="ps-title-1">Hyvää työtä!</h2>
            <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10, maxWidth: 300 }}>{done.body}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
            <CTA fi={done.primaryFi} en={done.primaryEn} icon="lines" variant="ink" onClick={done.onPrimary} />
            {done.onSecondary && (
              <CTA fi={done.secondaryFi ?? ''} en={done.secondaryEn} variant="light" onClick={done.onSecondary} />
            )}
          </div>
        </div>
      </ScreenScroll>
    )
  }

  return (
    <ScreenScroll bottom={26}>
      <ExBar nav="close" onNav={onExit}
        center={<CenterLabel fi={label.fi} en={label.en} />}
        right={<Counter a={mastered} b={total} />}>
        <Bar value={(mastered / total) * 100} color="var(--ink)" track="var(--glass-deep)" h={7} />
      </ExBar>

      {phase === 'card' ? (
        <div key={'card' + idx} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="ps-card" style={{ marginTop: 20, padding: 0, borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
            {/* Violet header band: SANA label + tap-to-hear */}
            <div style={{ background: 'var(--written-bg)', padding: '18px 22px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              <StackLabel fi="SANA" en="word" color="var(--written)" />
              <SpeakerBtn reg="kirja" size={50} playing={playing} onClick={play} />
            </div>
            <div style={{ padding: '22px 24px 26px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 37.4,
                letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--ink)' }}>{w.fi}</div>
              {w.ipa && (
                <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 17.2,
                  color: 'var(--written)', marginTop: 12 }}>{w.ipa}</div>
              )}
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 16.3, color: 'var(--ink-2)', marginTop: 8 }}>
                "{w.en}"
              </div>
              <hr className="ps-rule" style={{ margin: '20px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="ps-label" style={{ color: 'var(--written)' }}>KIRJA</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16.3, color: 'var(--ink)' }}>{w.fi}</span>
                <span style={{ color: 'var(--ink-3)' }}><I name="arrow" size={18} sw={2} /></span>
                <span className="ps-label" style={{ color: 'var(--spoken)' }}>PUHE</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16.3, color: 'var(--ink)' }}>{w.fi}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-3)' }}>· sama</span>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 16 }} />
          <CTA fi="Testaa minua" en="Test me" iconRight="arrow" variant="ink" onClick={() => setPhase('quiz')} />
        </div>
      ) : (
        <div key={'quiz' + idx} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <StackLabel fi="TUNNISTA" en="Recognise" />
            <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0 4px' }}>
              <SpeakerBtn reg="kirja" size={52} playing={playing} onClick={play} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 33.1,
              letterSpacing: '-0.04em', color: 'var(--ink)' }}>{w.fi}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15.5, color: 'var(--ink-2)', marginTop: 8 }}>
              Mitä tämä tarkoittaa?
              {bilingual && (
                <span style={{ display: 'block', fontWeight: 500, fontSize: 13.5, color: 'var(--ink-3)', marginTop: 1 }}>
                  What does this mean?
                </span>
              )}
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 12 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {options.map((opt) => {
              const correct = opt === w.en, chosen = picked === opt
              const state = picked ? (correct ? 'correct' : chosen ? 'wrong' : null) : null
              return (
                <OptionRow key={opt} disabled={!!picked} state={state} onClick={() => setPicked(opt)}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    {opt}
                    {picked && correct && <span style={{ color: 'var(--spoken)' }}><I name="check" size={22} sw={2.4} /></span>}
                    {picked && chosen && !correct && <span style={{ color: '#C2603F' }}><I name="close" size={22} sw={2.4} /></span>}
                  </span>
                </OptionRow>
              )
            })}
          </div>

          <div style={{ marginTop: 14, minHeight: 56 }}>
            {picked && (
              <CTA variant={picked === w.en ? 'spoken' : 'ink'} iconRight="arrow" onClick={next}
                fi={picked === w.en ? 'Hienoa!' : 'Jatka'}
                en={picked === w.en ? 'Great, continue' : 'Continue'} />
            )}
          </div>
        </div>
      )}
    </ScreenScroll>
  )
}
