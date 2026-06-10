import { useMemo, useState } from 'react'
import { BrandMark, RegDot, Sentence } from '../components/primitives'
import { Bar, SpeakerBtn } from '../components/ui'
import { I } from '../components/icons'
import { CTA, ExBar, CenterLabel, Counter, FieldArea, OptionRow, StackLabel, Waveform } from '../components/kit'
import { ScreenScroll, AppScreen } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'
import { fetchGradedSentences, levelForBank, RegisterSentence } from '../lib/data/content'
import { fetchProgressStats } from '../lib/data/stats'
import { gradeAnswer } from '../lib/grade'
import { bumpPracticeCount } from '../lib/practiceStats'
import { speak } from '../lib/tts'
import { useStudyClock } from '../lib/studyTime'

/* ---------------------------------------------------------------------------
 * Listening practice — audio first. Two exercise kinds alternate: type what
 * you heard (dictation), and choose what it means. Level-matched to the bank.
 * ------------------------------------------------------------------------- */

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

  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={26} />
  if (error) return <StatePane tone="error" title="Couldn't load listening" detail={error} bottom={26} />
  if (!data || data.sentences.length === 0) return <StatePane title={bi('Ei lauseita vielä', 'No sentences yet')} detail="No sentences available yet." bottom={26} />

  return <ListenSession key={data.sentences.map((s) => s.id).join(',')} sentences={data.sentences} level={data.level} go={go} />
}

function ListenSession({ sentences, level, go }: { sentences: RegisterSentence[]; level: string; go: (s: AppScreen) => void }) {
  const { bilingual, biText } = useLang()
  useStudyClock()
  const [i, setI] = useState(0)
  const [typed, setTyped] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [done, setDone] = useState(false)

  const p = sentences[i]
  const kirjaText = p.kirja.map((t) => t.t).join(' ')
  const dictation = i % 2 === 0 // alternate: type what you heard / choose the meaning
  const wasRight = dictation
    ? revealed && gradeAnswer(typed, kirjaText).tier !== 'wrong'
    : picked === p.gloss

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

  const checkTyped = () => {
    if (!typed.trim() || revealed) return
    if (gradeAnswer(typed, kirjaText).tier !== 'wrong') setCorrect((c) => c + 1)
    setRevealed(true)
  }
  const choose = (opt: string) => {
    if (picked) return
    setPicked(opt)
    if (opt === p.gloss) setCorrect((c) => c + 1)
  }

  const next = () => {
    if (i < sentences.length - 1) {
      setI(i + 1); setTyped(''); setPicked(null); setRevealed(false)
    } else {
      bumpPracticeCount('listen')
      setDone(true)
    }
  }

  if (done) {
    return (
      <ScreenScroll bottom={26}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          alignItems: 'center', textAlign: 'center', gap: 24 }}>
          <BrandMark size={140} />
          <div>
            <StackLabel fi="KUUNTELU VALMIS" en="Listening complete" color="var(--flag)" style={{ marginBottom: 10 }} />
            <h2 className="ps-title-1">Hyvää työtä!</h2>
            <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10 }}>
              {correct} / {sentences.length} oikein{bilingual && <span style={{ color: 'var(--ink-3)' }}> correct</span>}
            </p>
          </div>
          <CTA fi="Valmis" en="Done" iconRight="arrow" variant="ink" style={{ maxWidth: 320 }} onClick={() => go('practice')} />
        </div>
      </ScreenScroll>
    )
  }

  return (
    <ScreenScroll bottom={26}>
      <ExBar nav="close" onNav={() => go('practice')}
        center={<CenterLabel fi="KUUNTELEMINEN" en="Listening" color="var(--flag)" />}
        right={<Counter a={i + 1} b={sentences.length} />}>
        <Bar value={((i + 1) / sentences.length) * 100} color="var(--flag)" track="var(--glass-deep)" h={7} />
      </ExBar>

      {dictation && !revealed && (
        <>
          <div style={{ textAlign: 'center', marginTop: 26 }}>
            <StackLabel fi="KUUNTELE" en="Listen" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
            <button onClick={play} className="ps-press" aria-label="Play" style={{
              width: 132, height: 132, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: playing ? 'var(--ink)' : 'var(--flag)', color: '#fff',
              boxShadow: '0 18px 40px -14px rgba(43,111,219,.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s',
            }}>
              <I name="volume" size={52} sw={1.8} />
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Waveform color="var(--flag)" n={32} active={playing ? 0.85 : 0.4} h={44} />
          </div>
          <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14,
            color: 'var(--ink-2)', margin: '20px auto 0', maxWidth: 260, textWrap: 'pretty' }}>
            Kuuntele ja kirjoita, mitä kuulit.
            {bilingual && (
              <span style={{ display: 'block', fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>
                Listen, then type what you heard.
              </span>
            )}
          </p>
          <div style={{ flex: 1, minHeight: 16 }} />
          <div style={{ marginBottom: 14 }}>
            <FieldArea value={typed} onChange={setTyped} rows={2}
              placeholder={biText('Kirjoita tähän…', 'Type here')} onEnter={checkTyped} />
          </div>
          <CTA fi="Tarkista" en="Check" variant="ink" disabled={!typed.trim()} onClick={checkTyped} />
        </>
      )}

      {dictation && revealed && (
        <>
          <div style={{ textAlign: 'center', marginTop: 22 }}>
            <StackLabel fi={wasRight ? 'OIKEIN!' : 'NÄIN SE KIRJOITETAAN'} en={wasRight ? 'Correct!' : 'Here is how it is written'}
              color={wasRight ? 'var(--spoken)' : 'var(--flag)'} />
          </div>
          <div className="ps-card" style={{ marginTop: 18, padding: 20, borderRadius: 'var(--r-2xl)',
            border: `1.5px solid ${wasRight ? 'var(--spoken)' : 'var(--glass-line)'}` }}>
            <RegDot reg="kirja" />
            <div style={{ marginTop: 9 }}>
              <Sentence tokens={p.kirja} font="var(--font-display)" weight={600} size={24} color="var(--ink)" />
            </div>
            <div className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 12 }}>"{p.gloss}"</div>
            <div style={{ marginTop: 16 }}>
              <SpeakerBtn reg="kirja" playing={playing} onClick={play} size={44} />
            </div>
            {!wasRight && typed.trim() && (
              <div className="ps-caption" style={{ marginTop: 12 }}>Sinä kirjoitit: "{typed.trim()}"</div>
            )}
          </div>
          <div style={{ flex: 1, minHeight: 14 }} />
          <CTA fi="Seuraava" en="Next" iconRight="arrow" variant="ink" onClick={next} />
        </>
      )}

      {!dictation && (
        <>
          <div style={{ textAlign: 'center', marginTop: 22 }}>
            <button onClick={play} className="ps-press" aria-label="Play again" style={{
              width: 76, height: 76, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: playing ? 'var(--flag)' : 'var(--flag-bg)', color: playing ? '#fff' : 'var(--flag)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s, color .15s',
            }}>
              <I name="volume" size={32} sw={1.9} />
            </button>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15.8, color: 'var(--ink)', marginTop: 16 }}>
              Mitä kuulit?
              {bilingual && (
                <span style={{ display: 'block', fontWeight: 500, fontSize: 13.5, color: 'var(--ink-3)', marginTop: 1 }}>
                  What did you hear?
                </span>
              )}
            </div>
            <span className="ps-label ps-num" style={{ color: 'var(--ink-3)', display: 'inline-block', marginTop: 8 }}>{level}</span>
          </div>

          <div style={{ flex: 1, minHeight: 22 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {options.map((opt) => {
              const isCorrect = opt === p.gloss, chosen = picked === opt
              const state = picked ? (isCorrect ? 'correct' : chosen ? 'wrong' : null) : null
              return (
                <OptionRow key={opt} disabled={!!picked} state={state} onClick={() => choose(opt)}
                  style={{ fontFamily: 'var(--font-body)', fontSize: 15.5 }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    {opt}
                    {picked && isCorrect && <span style={{ color: 'var(--spoken)' }}><I name="check" size={24} sw={2.6} /></span>}
                    {picked && chosen && !isCorrect && <span style={{ color: '#C2603F' }}><I name="close" size={24} sw={2.6} /></span>}
                  </span>
                </OptionRow>
              )
            })}
          </div>

          <div style={{ marginTop: 14, minHeight: 56 }}>
            {picked && !revealed && (
              <CTA fi="Näytä teksti" en="See it written" iconRight="arrow" variant="ink" onClick={() => setRevealed(true)} />
            )}
            {picked && revealed && (
              <>
                <div className="ps-card" style={{ padding: 20, borderRadius: 'var(--r-2xl)', marginBottom: 14 }}>
                  <RegDot reg="kirja" />
                  <div style={{ marginTop: 9 }}>
                    <Sentence tokens={p.kirja} font="var(--font-display)" weight={600} size={22} color="var(--ink)" />
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <SpeakerBtn reg="kirja" playing={playing} onClick={play} size={42} />
                  </div>
                </div>
                <CTA fi="Seuraava" en="Next" iconRight="arrow" variant="ink" onClick={next} />
              </>
            )}
          </div>
        </>
      )}
    </ScreenScroll>
  )
}
