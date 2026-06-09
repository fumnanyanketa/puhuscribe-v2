import { useMemo, useState } from 'react'
import { OrbCluster, Label, SkillChip, RegDot, Sentence } from '../components/primitives'
import { Btn, IconBtn, SpeakerBtn } from '../components/ui'
import { I } from '../components/icons'
import { ScreenScroll, AppScreen } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'
import { fetchGradedSentences, levelForBank, RegisterSentence } from '../lib/data/content'
import { fetchProgressStats } from '../lib/data/stats'
import { speak } from '../lib/tts'

type Loaded = { sentences: RegisterSentence[]; level: string }

export function Listen({ go }: { go: (s: AppScreen) => void }) {
  const { user } = useAuth()
  const { bi } = useLang()
  const { data, loading, error } = useAsync<Loaded>(
    async () => {
      const bank = user ? (await fetchProgressStats(user.id)).totalCards : 0
      const sentences = await fetchGradedSentences(bank, 10)
      return { sentences, level: levelForBank(bank) }
    },
    [user?.id],
  )

  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={110} />
  if (error) return <StatePane tone="error" title="Couldn't load listening" detail={error} bottom={110} />
  if (!data || data.sentences.length === 0) return <StatePane title={bi('Ei lauseita vielä', 'No sentences yet')} detail="No sentences available yet." bottom={110} />

  return <ListenSession key={data.sentences.map((s) => s.id).join(',')} sentences={data.sentences} level={data.level} go={go} />
}

function ListenSession({ sentences, level, go }: { sentences: RegisterSentence[]; level: string; go: (s: AppScreen) => void }) {
  const { bi } = useLang()
  const [i, setI] = useState(0)
  const [phase, setPhase] = useState<'listen' | 'choose' | 'reveal'>('listen')
  const [picked, setPicked] = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [done, setDone] = useState(false)

  const p = sentences[i]
  const kirjaText = p.kirja.map((t) => t.t).join(' ')

  // 4 English options: the right gloss + 3 deterministic distractors (DayOne pattern).
  const options = useMemo(() => {
    const pool = sentences.filter((x) => x.gloss !== p.gloss)
    const picks = new Set<string>()
    let k = 0
    while (picks.size < 3 && k < pool.length * 2 && pool.length > 0) {
      picks.add(pool[(i * 7 + k) % pool.length].gloss)
      k++
    }
    return [p.gloss, ...picks].sort((a, b) => ((a.length + i) % 3) - ((b.length + i) % 3))
  }, [i, sentences, p.gloss])

  const play = () => { setPlaying(true); speak(kirjaText); setTimeout(() => setPlaying(false), 1400) }

  const choose = (opt: string) => {
    if (picked) return
    setPicked(opt)
    if (opt === p.gloss) setCorrect((c) => c + 1)
  }

  const next = () => {
    if (i < sentences.length - 1) { setI(i + 1); setPhase('listen'); setPicked(null) }
    else setDone(true)
  }

  if (done) return (
    <ScreenScroll bottom={110}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 24 }}>
        <OrbCluster size={190} />
        <div>
          <Label color="var(--flag)" style={{ display: 'block', marginBottom: 10 }}>{bi('Kuuntelu valmis', 'Listening complete')}</Label>
          <h2 className="ps-title-1">{bi('Hyvää työtä!', 'Good work.')}</h2>
          <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10 }}>{correct} / {sentences.length} {bi('oikein', 'correct')}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="light" onClick={() => go('write')}>{bi('Kirjoita', 'Write')}</Btn>
          <Btn variant="primary" onClick={() => go('practice')}>{bi('Valmis', 'Done')}</Btn>
        </div>
      </div>
    </ScreenScroll>
  )

  return (
    <ScreenScroll bottom={110}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconBtn icon="arrowL" tone="glass" size={40} onClick={() => go('practice')} />
        <span className="ps-label ps-num" style={{ color: 'var(--ink-2)' }}>{i + 1} / {sentences.length}</span>
        <span style={{ width: 40 }} />
      </div>
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Label color="var(--flag)">{bi('Kuuntelu', 'Listening')}</Label>
        <SkillChip skill="listen" />
        <span className="ps-label ps-num" style={{ color: 'var(--ink-3)' }}>{level}</span>
      </div>

      {phase === 'listen' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 22, marginTop: 10 }}>
          <button onClick={play} className="ps-press" aria-label="Play" style={{
            width: 104, height: 104, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: playing ? 'var(--flag)' : 'var(--ink)', color: '#fff',
            boxShadow: playing ? '0 0 0 10px var(--flag-bg), var(--sh-2)' : 'var(--sh-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s, box-shadow .15s',
          }}>
            <I name="speaker" size={40} />
          </button>
          <div className="ps-body" style={{ color: 'var(--ink-2)', maxWidth: 280 }}>
            {bi('Kuuntele ja yritä ymmärtää. Voit kuunnella uudelleen.', 'Listen and try to understand. You can replay it.')}
          </div>
          <Btn variant="primary" block iconRight="arrow" onClick={() => setPhase('choose')}>{bi('Mitä se tarkoittaa?', 'What does it mean?')}</Btn>
        </div>
      )}

      {phase === 'choose' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <SpeakerBtn reg="kirja" playing={playing} onClick={play} size={48} />
            <span className="ps-caption">{bi('Toista', 'Replay')}</span>
          </div>
          <div className="ps-label" style={{ color: 'var(--ink-3)', textAlign: 'center', margin: '18px 0 12px' }}>
            {bi('Mitä kuulit?', 'What did you hear?')}
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {options.map((opt) => {
              const isCorrect = opt === p.gloss, chosen = picked === opt
              let bg = 'var(--glass-2)', bd = 'var(--glass-line)', col = 'var(--ink)'
              if (picked) {
                if (isCorrect) { bg = 'rgba(107,70,193,.12)'; bd = 'var(--written)'; col = 'var(--written)' }
                else if (chosen) { bg = 'var(--flag-bg)'; bd = 'var(--flag)'; col = 'var(--flag)' }
              }
              return (
                <button key={opt} disabled={!!picked} onClick={() => choose(opt)} className="ps-press" style={{
                  textAlign: 'left', padding: '16px 20px', borderRadius: 'var(--r-md)', cursor: picked ? 'default' : 'pointer',
                  border: `1.5px solid ${bd}`, background: bg, color: col, fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15.5,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                }}>
                  {opt}
                  {picked && isCorrect && <I name="check" size={20} />}
                  {picked && chosen && !isCorrect && <I name="close" size={20} />}
                </button>
              )
            })}
          </div>
          <div style={{ flex: 1, minHeight: 14 }} />
          {picked && (
            <Btn variant="primary" block iconRight="arrow" onClick={() => setPhase('reveal')}>{bi('Näytä teksti', 'See it written')}</Btn>
          )}
        </div>
      )}

      {phase === 'reveal' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: 18 }}>
          <div className="ps-card" style={{ padding: 20, borderRadius: 'var(--r-2xl)' }}>
            <RegDot reg="kirja" />
            <div style={{ marginTop: 9 }}>
              <Sentence tokens={p.kirja} font="var(--font-display)" weight={600} size={24} color="var(--ink)" />
            </div>
            <div className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 12, fontStyle: 'italic' }}>“{p.gloss}”</div>
            <div style={{ marginTop: 16 }}>
              <SpeakerBtn reg="kirja" playing={playing} onClick={play} size={44} />
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 14 }} />
          <Btn variant="primary" block iconRight="arrow" onClick={next}>{bi('Seuraava', 'Next')}</Btn>
        </div>
      )}
    </ScreenScroll>
  )
}
