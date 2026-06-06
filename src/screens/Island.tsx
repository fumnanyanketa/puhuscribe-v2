import { useState, useRef, useEffect } from 'react'
import { OrbCluster, Label, RegDot, Sentence } from '../components/primitives'
import { Btn, SpeakerBtn, IconBtn } from '../components/ui'
import { I } from '../components/icons'
import { ScreenScroll, AppScreen } from '../components/Shell'
import { Token } from '../components/primitives'

interface Phrase { gloss: string; kirja: Token[]; puhe: Token[] }

const ISLAND: Phrase = {
  gloss: 'Do you want to come along?',
  kirja: [{ t: 'Haluatko', hot: true }, { t: 'tulla' }, { t: 'mukaan?' }],
  puhe:  [{ t: 'Haluuks', hot: true }, { t: 'sä', hot: true }, { t: 'tulla' }, { t: 'mukaan?' }],
}

type State = 'idle' | 'playing' | 'recording' | 'review'

function Wave({ active, color }: { active: boolean; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 40, flex: 1 }}>
      {Array.from({ length: 22 }).map((_, idx) => {
        const base = 6 + Math.abs(Math.sin(idx * 0.9)) * 28
        return (
          <span key={idx} style={{
            width: 3, borderRadius: 2,
            height: active ? base : 6 + (idx % 3) * 4,
            background: color, opacity: active ? 1 : 0.4,
            transition: 'height .25s ease', transitionDelay: (idx * 18) + 'ms',
          }} />
        )
      })}
    </div>
  )
}

export function Island({ go }: { go: (s: AppScreen) => void }) {
  const [st, setSt] = useState<State>('idle')
  const [sec, setSec] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const playNative = () => {
    setSt('playing')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setSt('idle'), 1400)
  }

  const toggleRecord = () => {
    if (st === 'recording') {
      if (timer.current) clearInterval(timer.current)
      setSt('review')
      return
    }
    setSt('recording')
    setSec(0)
    timer.current = setInterval(() => setSec((s) => +(s + 0.1).toFixed(1)), 100)
  }

  useEffect(() => () => {
    if (timer.current) { clearTimeout(timer.current); clearInterval(timer.current) }
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-grad)' }}>
      {/* Hero band */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 230, overflow: 'hidden',
        background: 'linear-gradient(160deg, #6E4BC0, #4E2A86)' }}>
        <OrbCluster size={230} style={{ position: 'absolute', right: -34, top: -20, opacity: 0.95 }} />
        <div style={{ position: 'absolute', left: -40, bottom: -50, width: 160, height: 160,
          borderRadius: '50%', border: '2px solid rgba(255,255,255,.18)' }} />
      </div>

      <ScreenScroll bg="transparent" bottom={110}>
        {/* Hero content */}
        <div style={{ color: 'var(--on-dark)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <IconBtn icon="arrowL" tone="solid" size={44} onClick={() => go('daily')} />
            <span className="ps-chip" style={{
              background: 'rgba(15,14,32,.36)', color: '#fff',
              border: '1px solid rgba(255,255,255,.28)', backdropFilter: 'blur(6px)',
            }}>
              <I name="island" size={15} /> Saari 3 / 8
            </span>
          </div>
          <div style={{ marginTop: 22 }}>
            <Label color="rgba(255,255,255,.75)">Varjostus · Shadowing</Label>
            <h1 className="ps-title-1" style={{ color: 'var(--on-dark)', marginTop: 10 }}>Toista ääneen</h1>
          </div>
        </div>

        <div style={{ height: 26 }} />

        {/* Shadowing card */}
        <div className="ps-card" style={{ padding: 20, borderRadius: 'var(--r-2xl)', boxShadow: 'var(--sh-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingBottom: 14, marginBottom: 16, borderBottom: '1px solid var(--glass-edge)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ps-caption">You are shadowing</span>
              <span className="ps-label" style={{ color: 'var(--written)', background: 'var(--written-bg)', padding: '5px 10px', borderRadius: 7 }}>Kirjakieli</span>
            </div>
            <span className="ps-caption" style={{ fontStyle: 'italic' }}>{ISLAND.gloss}</span>
          </div>

          <div>
            <RegDot reg="kirja" />
            <div style={{ marginTop: 9 }}>
              <Sentence tokens={ISLAND.kirja} font="var(--font-display)" weight={600} size={26} color="var(--ink)" />
            </div>
          </div>

          <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--spoken-bg)',
            border: '1px solid var(--spoken-line)', borderRadius: 'var(--r-md)', opacity: 0.92 }}>
            <RegDot reg="puhe" />
            <div style={{ marginTop: 8 }}>
              <Sentence tokens={ISLAND.puhe} font="var(--font-body)" weight={600} size={18} color="var(--ink-2)" />
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
            <SpeakerBtn reg="kirja" playing={st === 'playing'} onClick={playNative} size={48} />
            <Wave active={st === 'playing'} color="var(--written)" />
            <span className="ps-caption ps-num" style={{ marginLeft: 'auto' }}>0:03</span>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 18 }} />

        {/* Record control */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          {st === 'review' ? (
            <div style={{ width: '100%' }}>
              <div className="ps-glass" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14,
                background: 'var(--written-bg)', border: '1px solid var(--written)' }}>
                <span style={{ color: 'var(--written)' }}><I name="check" size={26} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--written)' }}>Hyvä ääntämys</div>
                  <div className="ps-caption" style={{ marginTop: 2 }}>Close match to the native clip</div>
                </div>
                <SpeakerBtn reg="puhe" size={42} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <Btn variant="light" icon="mic" style={{ flex: 1 }} onClick={() => setSt('idle')}>Uudelleen</Btn>
                <Btn variant="primary" iconRight="arrow" style={{ flex: 1.2 }} onClick={() => setSt('idle')}>Seuraava</Btn>
              </div>
            </div>
          ) : (
            <>
              <button onClick={toggleRecord} className="ps-press" aria-label="Record" style={{
                width: 80, height: 80, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: st === 'recording' ? 'var(--spoken)' : 'var(--ink)', color: '#fff',
                boxShadow: st === 'recording' ? '0 0 0 8px var(--spoken-bg), var(--sh-2)' : 'var(--sh-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background .15s, box-shadow .15s',
              }}>
                {st === 'recording'
                  ? <span style={{ width: 24, height: 24, borderRadius: 7, background: 'currentColor' }} />
                  : <I name="mic" size={32} sw={1.9} />}
              </button>
              <span className="ps-caption ps-num" style={{
                color: st === 'recording' ? 'var(--spoken)' : 'var(--ink-2)', fontWeight: 600,
              }}>
                {st === 'recording' ? `● Nauhoitetaan ${sec.toFixed(1)}s, tap to stop` : 'Tap to repeat the written form'}
              </span>
            </>
          )}
        </div>
      </ScreenScroll>
    </div>
  )
}
