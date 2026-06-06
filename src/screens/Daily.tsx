import { useMemo, useState } from 'react'
import { OrbCluster, Label } from '../components/primitives'
import { RegisterCard } from '../components/RegisterCard'
import { Btn, Bar, Steps } from '../components/ui'
import { I } from '../components/icons'
import { ScreenScroll, AppScreen } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { fetchSentences, RegisterSentence } from '../lib/data/content'

const SESSION_SIZE = 8

export function Daily({ go }: { go: (s: AppScreen) => void }) {
  // Pull a broad pool, then sample evenly across it so the session spans
  // several topics rather than eight greetings in a row.
  const { data: pool, loading, error } = useAsync<RegisterSentence[]>(
    () => fetchSentences({ limit: 160 }),
    [],
  )

  const session = useMemo(() => {
    if (!pool || pool.length === 0) return []
    const step = Math.max(1, Math.floor(pool.length / SESSION_SIZE))
    const out: RegisterSentence[] = []
    for (let k = 0; k < pool.length && out.length < SESSION_SIZE; k += step) out.push(pool[k])
    return out
  }, [pool])

  if (loading) return <StatePane title="Ladataan sessiota…" bottom={110} />
  if (error) return <StatePane tone="error" title="Session lataus epäonnistui" detail={error} bottom={110} />
  if (session.length === 0) return <StatePane title="Ei lauseita vielä" detail="No sentences available yet." bottom={110} />

  return <Session phrases={session} go={go} />
}

function Session({ phrases, go }: { phrases: RegisterSentence[]; go: (s: AppScreen) => void }) {
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState<'kirja' | 'puhe' | null>(null)
  const [mastered, setMastered] = useState(0)
  const [done, setDone] = useState(false)

  const p = phrases[i]
  const play = (reg: 'kirja' | 'puhe') => { setPlaying(reg); setTimeout(() => setPlaying(null), 1100) }
  const advance = (got: boolean) => {
    if (got) setMastered((m) => m + 1)
    if (i < phrases.length - 1) setI(i + 1)
    else setDone(true)
  }

  if (done) return (
    <ScreenScroll bottom={110}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', textAlign: 'center', gap: 24 }}>
        <OrbCluster size={190} />
        <div>
          <Label color="var(--written)" style={{ display: 'block', marginBottom: 10 }}>Sessio valmis</Label>
          <h2 className="ps-title-1">Hyvää työtä.</h2>
          <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10 }}>
            {phrases.length} phrases reviewed · {mastered} newly mastered
          </p>
        </div>
        <div className="ps-glass" style={{ padding: '18px 24px', display: 'flex', gap: 28 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, lineHeight: 1, letterSpacing: '-0.03em' }}>{mastered}</div>
            <div className="ps-caption" style={{ marginTop: 4 }}>mastered</div>
          </div>
          <div style={{ width: 1, background: 'var(--glass-edge)' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, lineHeight: 1, color: 'var(--spoken)', letterSpacing: '-0.03em' }}>{phrases.length}</div>
            <div className="ps-caption" style={{ marginTop: 4 }}>in session</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="light" onClick={() => go('island')}>Kielisaari</Btn>
          <Btn variant="primary" icon="chart" onClick={() => go('progress')}>Edistyminen</Btn>
        </div>
      </div>
    </ScreenScroll>
  )

  return (
    <ScreenScroll bottom={110}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <Label color="var(--written)">Huomenta · Tervetuloa</Label>
          <h1 className="ps-title-1" style={{ marginTop: 8 }}>Päivän sessio</h1>
        </div>
      </div>

      {/* Session mastered strip */}
      <div className="ps-glass" style={{ padding: 16, marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 }}>
          <span className="ps-caption">Mastered this session</span>
          <span className="ps-num" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>{mastered}/{phrases.length}</span>
        </div>
        <Bar value={(mastered / phrases.length) * 100} color="var(--written)" />
      </div>

      {/* Session progress */}
      <div style={{ marginTop: 20, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Steps total={phrases.length} current={i} />
        <span className="ps-label" style={{ color: 'var(--ink-2)', flexShrink: 0 }}>{i + 1}/{phrases.length}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <RegisterCard key={i} glass onPlay={play} playing={playing}
          gloss={p.gloss} kirja={p.kirja} puhe={p.puhe} badge="Arki · daily" />
        <div className="ps-caption" style={{ textAlign: 'center', marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
          <I name="speaker" size={15} /> Tap a register to hear it
        </div>
        <div style={{ flex: 1, minHeight: 16 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="light" style={{ flex: 1 }} onClick={() => advance(false)}>Vielä harjoittelen</Btn>
          <Btn variant="primary" icon="check" style={{ flex: 1.2 }} onClick={() => advance(true)}>Osaan</Btn>
        </div>
      </div>
    </ScreenScroll>
  )
}
