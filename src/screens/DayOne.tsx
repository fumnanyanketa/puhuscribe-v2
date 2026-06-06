import { useState, useMemo } from 'react'
import { Orb, OrbCluster, Label } from '../components/primitives'
import { Btn, IconBtn } from '../components/ui'
import { I } from '../components/icons'
import { ScreenScroll, AppScreen } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { fetchSprintWords, SprintWord } from '../lib/data/content'

// Orb gradient pairs cycled per card (the DB carries no presentation colour).
const ORB_PALETTE: [string, string][] = [
  ['var(--orb-magenta)', 'var(--orb-pink)'],
  ['var(--orb-violet)',  'var(--orb-magenta)'],
  ['var(--orb-deep)',    'var(--orb-violet)'],
  ['var(--orb-pink)',    '#7FC6D8'],
  ['var(--orb-magenta)', 'var(--orb-violet)'],
]

export function DayOne({ go }: { go: (s: AppScreen) => void }) {
  const { data: words, loading, error } = useAsync<SprintWord[]>(fetchSprintWords, [])

  if (loading) return <StatePane title="Ladataan sanoja…" />
  if (error) return <StatePane tone="error" title="Sanojen lataus epäonnistui" detail={error} />
  if (!words || words.length === 0) return <StatePane title="Ei sanoja vielä" detail="No sprint words available yet." />

  return <Sprint words={words} go={go} />
}

function Sprint({ words, go }: { words: SprintWord[]; go: (s: AppScreen) => void }) {
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<'card' | 'quiz'>('card')
  const [picked, setPicked] = useState<string | null>(null)
  const [mastered, setMastered] = useState(0)

  const total = words.length
  const w = words[idx % total]
  const orb = ORB_PALETTE[idx % ORB_PALETTE.length]
  const wave = Math.min(8, Math.floor((mastered / total) * 8) + 1)

  const options = useMemo(() => {
    const pool = words.filter((x) => x.en !== w.en)
    const picks = new Set<string>()
    let k = 0
    while (picks.size < 3 && k < pool.length * 2 && pool.length > 0) {
      picks.add(pool[(idx * 7 + k) % pool.length].en)
      k++
    }
    return [w.en, ...picks].sort((a, b) => ((a.length + idx) % 3) - ((b.length + idx) % 3))
  }, [idx, words, w.en])

  const next = () => {
    setMastered((m) => Math.min(total, m + 1))
    setPicked(null)
    setPhase('card')
    setIdx((x) => x + 1)
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <ScreenScroll>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconBtn icon="close" tone="glass" size={40} onClick={() => go('daily')} />
          <Label color="var(--written)">{`Day One · Aalto ${wave} / 8`}</Label>
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
                height: 188, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'radial-gradient(120% 90% at 70% 20%, rgba(255,255,255,.5), transparent), var(--lav-tint)',
              }}>
                <div style={{ position: 'absolute', top: 14, left: 16 }}>
                  <Label color="var(--written)">Muistikuva · mnemonic</Label>
                </div>
                <OrbCluster size={150} />
                <div style={{ position: 'absolute', bottom: 12, right: 16 }} className="ps-caption">[ 3D render ]</div>
              </div>

              {/* Word info */}
              <div style={{ padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 44, lineHeight: 1, letterSpacing: '-0.04em' }}>{w.fi}</div>
                  {w.ipa && <span className="ps-label ps-num" style={{ color: 'var(--ink-3)' }}>{w.ipa}</span>}
                </div>
                <div className="ps-body-l" style={{ marginTop: 8, color: 'var(--ink-2)' }}>"{w.en}"</div>

                {/* Sound-bridge mnemonic */}
                <div style={{
                  marginTop: 16, padding: '13px 15px', background: 'var(--flag-bg)', borderRadius: 'var(--r-md)',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <span style={{ color: 'var(--flag)', flexShrink: 0, marginTop: 1 }}>
                    <I name="sparkle" size={18} />
                  </span>
                  <span className="ps-body" style={{ color: 'var(--ink)' }}>{w.bridge}</span>
                </div>

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
            <Btn variant="primary" block iconRight="arrow" onClick={() => setPhase('quiz')}>Testaa minua</Btn>
          </div>
        ) : (
          <div key={'quiz' + idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: 22 }}>
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <Label color="var(--ink-3)">Tunnista · Recognise</Label>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '18px 0 8px' }}>
                <Orb size={76} from={orb[0]} to={orb[1]} />
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 46, lineHeight: 1.05, letterSpacing: '-0.04em' }}>{w.fi}</div>
              <div className="ps-caption" style={{ marginTop: 6 }}>Mitä tämä tarkoittaa?</div>
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
                  {picked === w.en ? 'Hienoa — jatka' : 'Jatka'}
                </Btn>
              )}
            </div>
          </div>
        )}
      </ScreenScroll>
    </div>
  )
}
