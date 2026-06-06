import { useState } from 'react'
import { OrbCluster, Label } from '../components/primitives'
import { RegisterCard } from '../components/RegisterCard'
import { Btn, Bar, Steps } from '../components/ui'
import { I } from '../components/icons'
import { ScreenScroll, AppScreen } from '../components/Shell'
import { Token } from '../components/primitives'

interface Phrase {
  gloss: string
  kirja: Token[]
  puhe: Token[]
}

const PHRASES: Phrase[] = [
  { gloss: 'I am at home',
    kirja: [{ t: 'Minä', hot: true }, { t: 'olen', hot: true }, { t: 'kotona' }],
    puhe:  [{ t: 'Mä', hot: true }, { t: 'oon', hot: true }, { t: 'kotona' }] },
  { gloss: 'Do you want to come along?',
    kirja: [{ t: 'Haluatko', hot: true }, { t: 'tulla' }, { t: 'mukaan?' }],
    puhe:  [{ t: 'Haluuks', hot: true }, { t: 'sä', hot: true }, { t: 'tulla' }, { t: 'mukaan?' }] },
  { gloss: 'He / she goes to the shop',
    kirja: [{ t: 'Hän', hot: true }, { t: 'menee' }, { t: 'kauppaan' }],
    puhe:  [{ t: 'Se', hot: true }, { t: 'menee' }, { t: 'kauppaan' }] },
  { gloss: 'Are you hungry?',
    kirja: [{ t: 'Onko', hot: true }, { t: 'sinulla', hot: true }, { t: 'nälkä?' }],
    puhe:  [{ t: 'Onks', hot: true }, { t: 'sulla', hot: true }, { t: 'nälkä?' }] },
]

export function Daily({ go }: { go: (s: AppScreen) => void }) {
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState<'kirja' | 'puhe' | null>(null)
  const [mastered, setMastered] = useState(843)
  const [done, setDone] = useState(false)

  const p = PHRASES[i]
  const play = (reg: 'kirja' | 'puhe') => { setPlaying(reg); setTimeout(() => setPlaying(null), 1100) }
  const advance = (got: boolean) => {
    if (got) setMastered((m) => m + 1)
    if (i < PHRASES.length - 1) setI(i + 1)
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
            {PHRASES.length} phrases reviewed · {mastered - 843} newly mastered
          </p>
        </div>
        <div className="ps-glass" style={{ padding: '18px 24px', display: 'flex', gap: 28 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, lineHeight: 1, letterSpacing: '-0.03em' }}>{mastered}</div>
            <div className="ps-caption" style={{ marginTop: 4 }}>mastered</div>
          </div>
          <div style={{ width: 1, background: 'var(--glass-edge)' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, lineHeight: 1, color: 'var(--spoken)', letterSpacing: '-0.03em' }}>12</div>
            <div className="ps-caption" style={{ marginTop: 4 }}>day streak</div>
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
          <Label color="var(--written)">Huomenta · Tiistai</Label>
          <h1 className="ps-title-1" style={{ marginTop: 8 }}>Päivän sessio</h1>
        </div>
        <div className="ps-glass" style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 999 }}>
          <span style={{ color: 'var(--spoken)' }}><I name="flame" size={18} /></span>
          <span className="ps-num" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>12</span>
        </div>
      </div>

      {/* Mastered strip */}
      <div className="ps-glass" style={{ padding: 16, marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 }}>
          <span className="ps-caption">Phrases mastered</span>
          <span className="ps-num" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>{mastered}</span>
        </div>
        <Bar value={(mastered / 1200) * 100} color="var(--written)" />
      </div>

      {/* Session progress */}
      <div style={{ marginTop: 20, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Steps total={PHRASES.length} current={i} />
        <span className="ps-label" style={{ color: 'var(--ink-2)', flexShrink: 0 }}>{i + 1}/{PHRASES.length}</span>
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
