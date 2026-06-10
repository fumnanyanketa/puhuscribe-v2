import { useMemo, useState } from 'react'
import { BrandMark, RegDot, Sentence } from '../components/primitives'
import { Bar } from '../components/ui'
import { I } from '../components/icons'
import { CTA, ExBar, CenterLabel, Counter, OptionRow, StackLabel } from '../components/kit'
import { ScreenScroll, AppScreen } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'
import { fetchGradedSentences, levelForBank, RegisterSentence } from '../lib/data/content'
import { fetchProgressStats } from '../lib/data/stats'
import { bumpPracticeCount } from '../lib/practiceStats'
import { useStudyClock } from '../lib/studyTime'

/* ---------------------------------------------------------------------------
 * Reading practice — text first: read a real everyday sentence, show you
 * understood it, then see the spoken form. Level-matched to the bank.
 * ------------------------------------------------------------------------- */

type Loaded = { sentences: RegisterSentence[]; level: string }

export function Read({ go }: { go: (s: AppScreen) => void }) {
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
