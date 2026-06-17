import { useMemo, useState, useEffect } from 'react'
import { BrandMark, RegDot, Sentence } from '../components/primitives'
import { Bar, SpeakerBtn } from '../components/ui'
import { I } from '../components/icons'
import { CTA, ExBar, CenterLabel, Counter, OptionRow, StackLabel, ChoiceCard, Eyebrow } from '../components/kit'
import { ScreenScroll, AppScreen } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'
import { fetchGradedSentences, levelForBank, RegisterSentence } from '../lib/data/content'
import { fetchProgressStats } from '../lib/data/stats'
import { bumpPracticeCount } from '../lib/practiceStats'
import { fetchReading, speak, Reading } from '../lib/tts'
import { useStudyClock } from '../lib/studyTime'

/* ---------------------------------------------------------------------------
 * Reading practice. Two modes:
 *  - Story (Tarina): connected comprehensible input — a short level-matched
 *    Finnish passage you understand IN Finnish (English is a hint only). The
 *    framework's Rail 1 done properly: understanding messages, not translating.
 *  - Sentences: the quick single-sentence comprehension drill.
 * ------------------------------------------------------------------------- */

type Loaded = { sentences: RegisterSentence[]; level: string }

export function Read({ go }: { go: (s: AppScreen) => void }) {
  const { bi } = useLang()
  const [mode, setMode] = useState<'pick' | 'story' | 'sentences'>('pick')

  if (mode === 'story') return <StoryReading go={go} onBack={() => setMode('pick')} />
  if (mode === 'sentences') return <SentenceReading go={go} />

  return (
    <ScreenScroll bottom={26}>
      <ExBar nav="close" onNav={() => go('practice')} center={<CenterLabel fi="LUKEMINEN" en="Reading" color="var(--written)" />} />
      <div style={{ marginTop: 16 }}>
        <Eyebrow fi="LUKEMINEN" en="Reading" color="var(--written)" style={{ marginBottom: 10 }} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 25,
          letterSpacing: '-0.03em', color: 'var(--ink)', margin: 0 }}>Miten haluat lukea?</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14.5, lineHeight: 1.5,
          color: 'var(--ink-2)', margin: '10px 0 0' }}>{bi('Valitse harjoitus', 'Choose a practice')}</p>
      </div>
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ChoiceCard align="top" icon="book" iconColor="var(--written)" iconBg="var(--written-bg)"
          title="Lyhyt tarina" en="Short story" onClick={() => setMode('story')}
          desc="Read a short Finnish text and understand it in Finnish. English only if you need it." />
        <ChoiceCard align="top" icon="lines" iconColor="var(--spoken)" iconBg="var(--spoken-bg)"
          title="Nopeat lauseet" en="Quick sentences" onClick={() => setMode('sentences')}
          desc="Read single everyday sentences and pick what they mean." />
      </div>
    </ScreenScroll>
  )
}

function SentenceReading({ go }: { go: (s: AppScreen) => void }) {
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
  if (error) return <StatePane tone="error" title="Couldn't load reading" detail={error} bottom={26} />
  if (!data || data.sentences.length === 0) return <StatePane title={bi('Ei lauseita vielä', 'No sentences yet')} detail="No sentences available yet." bottom={26} />

  return <ReadSession key={data.sentences.map((s) => s.id).join(',')} sentences={data.sentences} level={data.level} go={go} />
}

/* =====================================================================
   STORY — connected comprehensible input (Rail 1). A short level-matched
   Finnish passage, understood in Finnish; English is a reveal-on-demand hint.
   ===================================================================== */
const STORY_TOTAL = 4

function StoryReading({ go, onBack }: { go: (s: AppScreen) => void; onBack: () => void }) {
  const { user } = useAuth()
  const { bi, bilingual } = useLang()
  useStudyClock()

  const [level, setLevel] = useState('A1')
  const [story, setStory] = useState<Reading | null>(null)
  const [loading, setLoading] = useState(true)
  const [notReady, setNotReady] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const [showEn, setShowEn] = useState(false)
  const [round, setRound] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)

  const loadOne = async (lv: string) => {
    setLoading(true); setPicked(null); setShowEn(false)
    const r = await fetchReading(lv)
    setLoading(false)
    if (!r.ok) { setNotReady(true); return }
    setStory(r)
  }

  // On mount: get the learner's level, then load the first story.
  useEffect(() => {
    let active = true
    void (async () => {
      let lv = 'A1'
      try { if (user) lv = levelForBank((await fetchProgressStats(user.id)).totalCards) } catch { /* A1 */ }
      if (!active) return
      setLevel(lv)
      await loadOne(lv)
    })()
    return () => { active = false }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (idx: number) => {
    if (picked !== null || !story) return
    setPicked(idx)
    if (idx === story.answer) setCorrect((c) => c + 1)
  }

  const next = () => {
    if (round + 1 >= STORY_TOTAL) { bumpPracticeCount('read'); setDone(true); return }
    setRound((r) => r + 1)
    void loadOne(level)
  }

  if (notReady) {
    return (
      <ScreenScroll bottom={26}>
        <ExBar nav="back" onNav={onBack} center={<CenterLabel fi="TARINA" en="Story" color="var(--written)" />} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 16 }}>
          <BrandMark size={96} />
          <p className="ps-body" style={{ color: 'var(--ink-2)', maxWidth: 300 }}>
            {bi('Tarinat eivät ole vielä käytössä.', 'Stories are not switched on yet.')} Try the quick sentences instead.
          </p>
          <CTA fi="Takaisin" en="Back" variant="light" style={{ maxWidth: 280 }} onClick={onBack} />
        </div>
      </ScreenScroll>
    )
  }

  if (done) {
    return (
      <ScreenScroll bottom={26}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 24 }}>
          <BrandMark size={140} />
          <div>
            <StackLabel fi="LUKEMINEN VALMIS" en="Reading complete" color="var(--written)" style={{ marginBottom: 10 }} />
            <h2 className="ps-title-1">Hyvää työtä!</h2>
            <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10 }}>
              {correct} / {STORY_TOTAL} oikein{bilingual && <span style={{ color: 'var(--ink-3)' }}> correct</span>}
            </p>
          </div>
          <CTA fi="Valmis" en="Done" iconRight="arrow" variant="ink" style={{ maxWidth: 320 }} onClick={() => go('practice')} />
        </div>
      </ScreenScroll>
    )
  }

  if (loading || !story) return <StatePane title={bi('Luodaan tarinaa…', 'Writing a story…')} bottom={26} />

  return (
    <ScreenScroll bottom={26}>
      <ExBar nav="close" onNav={() => go('practice')}
        center={<CenterLabel fi="TARINA" en="Story" color="var(--written)" />}
        right={<Counter a={round + 1} b={STORY_TOTAL} />}>
        <Bar value={((round + 1) / STORY_TOTAL) * 100} color="var(--written)" track="var(--glass-deep)" h={7} />
      </ExBar>

      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <StackLabel fi="LUE SUOMEKSI" en="Read in Finnish" />
        <span className="ps-label ps-num" style={{ color: 'var(--ink-3)', display: 'block', marginTop: 8 }}>{level}</span>
      </div>

      {/* The passage — each line tappable to hear */}
      <div className="ps-card" style={{ marginTop: 16, padding: 20, borderRadius: 'var(--r-2xl)' }}>
        <RegDot reg="kirja" />
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {story.lines.map((ln, k) => (
            <div key={k} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19, lineHeight: 1.35, color: 'var(--ink)' }}>{ln}</span>
              <SpeakerBtn reg="kirja" size={36} onClick={() => speak(ln)} />
            </div>
          ))}
        </div>
        <button onClick={() => setShowEn((v) => !v)} className="ps-press" style={{ marginTop: 14, background: 'none',
          border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5, color: 'var(--ink-3)' }}>
          <I name="eye" size={15} sw={1.9} />
          {showEn ? bi('Piilota englanti', 'Hide English') : bi('En ymmärrä', "I don't understand")}
        </button>
        {showEn && story.en && (
          <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 500, fontSize: 13.8,
            color: 'var(--ink-3)', margin: '8px 0 0', lineHeight: 1.45 }}>{story.en}</p>
        )}
      </div>

      {/* Comprehension question — in Finnish */}
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16.5, color: 'var(--ink)', margin: '20px 0 12px' }}>
        {story.question}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {story.options.map((opt, idx) => {
          const isCorrect = idx === story.answer, chosen = picked === idx
          const state = picked !== null ? (isCorrect ? 'correct' : chosen ? 'wrong' : null) : null
          return (
            <OptionRow key={idx} disabled={picked !== null} state={state} onClick={() => choose(idx)}
              style={{ fontFamily: 'var(--font-body)', fontSize: 15.5 }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                {opt}
                {picked !== null && isCorrect && <span style={{ color: 'var(--spoken)' }}><I name="check" size={22} sw={2.4} /></span>}
                {picked !== null && chosen && !isCorrect && <span style={{ color: '#C2603F' }}><I name="close" size={22} sw={2.4} /></span>}
              </span>
            </OptionRow>
          )
        })}
      </div>

      <div style={{ flex: 1, minHeight: 14 }} />
      <div style={{ minHeight: 56 }}>
        {picked !== null && (
          <CTA fi={round + 1 >= STORY_TOTAL ? 'Valmis' : 'Seuraava tarina'}
            en={round + 1 >= STORY_TOTAL ? 'Done' : 'Next story'} iconRight="arrow" variant="ink" onClick={next} />
        )}
      </div>
    </ScreenScroll>
  )
}

function ReadSession({ sentences, level, go }: { sentences: RegisterSentence[]; level: string; go: (s: AppScreen) => void }) {
  const { bilingual } = useLang()
  useStudyClock()
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)

  const p = sentences[i]

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

  const choose = (opt: string) => {
    if (picked) return
    setPicked(opt)
    if (opt === p.gloss) setCorrect((c) => c + 1)
  }

  const next = () => {
    if (i < sentences.length - 1) { setI(i + 1); setPicked(null) }
    else { bumpPracticeCount('read'); setDone(true) }
  }

  if (done) {
    return (
      <ScreenScroll bottom={26}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          alignItems: 'center', textAlign: 'center', gap: 24 }}>
          <BrandMark size={140} />
          <div>
            <StackLabel fi="LUKEMINEN VALMIS" en="Reading complete" color="var(--written)" style={{ marginBottom: 10 }} />
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
        center={<CenterLabel fi="LUKEMINEN" en="Reading" color="var(--written)" />}
        right={<Counter a={i + 1} b={sentences.length} />}>
        <Bar value={((i + 1) / sentences.length) * 100} color="var(--written)" track="var(--glass-deep)" h={7} />
      </ExBar>

      <div style={{ textAlign: 'center', marginTop: 22 }}>
        <StackLabel fi="LUE" en="Read" />
        <span className="ps-label ps-num" style={{ color: 'var(--ink-3)', display: 'block', marginTop: 8 }}>{level}</span>
      </div>

      {/* The sentence, written form */}
      <div className="ps-card" style={{ marginTop: 16, padding: 20, borderRadius: 'var(--r-2xl)' }}>
        <RegDot reg="kirja" />
        <div style={{ marginTop: 9 }}>
          <Sentence tokens={p.kirja.map((t) => ({ t: t.t }))} font="var(--font-display)" weight={600} size={24} color="var(--ink)" />
        </div>
        {picked && (
          <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--spoken-bg)',
            border: '1px solid var(--spoken-line)', borderRadius: 'var(--r-md)' }}>
            <RegDot reg="puhe" />
            <div style={{ marginTop: 7 }}>
              <Sentence tokens={p.puhe} font="var(--font-body)" weight={600} size={16} color="var(--ink)" />
            </div>
          </div>
        )}
      </div>

      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15.8, color: 'var(--ink)',
        textAlign: 'center', margin: '18px 0 12px' }}>
        Mitä tämä tarkoittaa?
        {bilingual && (
          <span style={{ display: 'block', fontWeight: 500, fontSize: 13.5, color: 'var(--ink-3)', marginTop: 1 }}>
            What does it mean?
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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

      <div style={{ flex: 1, minHeight: 14 }} />
      <div style={{ minHeight: 56 }}>
        {picked && <CTA fi="Seuraava" en="Next" iconRight="arrow" variant="ink" onClick={next} />}
      </div>
    </ScreenScroll>
  )
}
