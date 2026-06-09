import { useState } from 'react'
import { OrbCluster, Label, SkillChip, RegDot, Sentence } from '../components/primitives'
import { Btn, IconBtn, SpeakerBtn } from '../components/ui'
import { ScreenScroll, AppScreen } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'
import { fetchGradedSentences, levelForBank, RegisterSentence } from '../lib/data/content'
import { fetchProgressStats } from '../lib/data/stats'
import { getWritingFeedback, speak } from '../lib/tts'

type Loaded = { sentences: RegisterSentence[]; level: string }
type Result = { ok: boolean; corrected: string; comment: string; ai: boolean }

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFC').replace(/[^\p{L}\s]/gu, '').replace(/\s+/g, ' ').trim()
}

export function Write({ go }: { go: (s: AppScreen) => void }) {
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
  if (error) return <StatePane tone="error" title="Couldn't load writing" detail={error} bottom={110} />
  if (!data || data.sentences.length === 0) return <StatePane title={bi('Ei lauseita vielä', 'No sentences yet')} detail="No sentences available yet." bottom={110} />

  return <WriteSession key={data.sentences.map((s) => s.id).join(',')} sentences={data.sentences} level={data.level} go={go} />
}

function WriteSession({ sentences, level, go }: { sentences: RegisterSentence[]; level: string; go: (s: AppScreen) => void }) {
  const { bi } = useLang()
  const [i, setI] = useState(0)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [done, setDone] = useState(false)

  const p = sentences[i]
  const model = p.kirja.map((t) => t.t).join(' ')

  const check = async () => {
    const text = input.trim()
    if (!text || busy) return
    setBusy(true)
    const fb = await getWritingFeedback(p.gloss, text)
    if (fb.configured) {
      setResult({ ok: fb.ok, corrected: fb.corrected || model, comment: fb.comment || '', ai: true })
    } else {
      const match = normalize(text) === normalize(model)
      setResult({ ok: match, corrected: model, comment: '', ai: false })
    }
    setBusy(false)
  }

  const next = () => {
    if (i < sentences.length - 1) { setI(i + 1); setInput(''); setResult(null) }
    else setDone(true)
  }

  if (done) return (
    <ScreenScroll bottom={110}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 24 }}>
        <OrbCluster size={190} />
        <div>
          <Label color="#C25B3F" style={{ display: 'block', marginBottom: 10 }}>{bi('Kirjoitus valmis', 'Writing complete')}</Label>
          <h2 className="ps-title-1">{bi('Hyvää työtä!', 'Good work.')}</h2>
          <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10, maxWidth: 300 }}>
            Writing is the skill most apps skip. Every sentence you produce makes the rest stick.
          </p>
        </div>
        <Btn variant="primary" onClick={() => go('practice')}>{bi('Valmis', 'Done')}</Btn>
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
        <Label color="#C25B3F">{bi('Kirjoittaminen', 'Writing')}</Label>
        <SkillChip skill="write" />
        <span className="ps-label ps-num" style={{ color: 'var(--ink-3)' }}>{level}</span>
      </div>

      {/* Prompt */}
      <div className="ps-glass" style={{ marginTop: 18, padding: 18 }}>
        <div className="ps-caption">{bi('Kirjoita suomeksi', 'Write this in Finnish')}</div>
        <div style={{ marginTop: 8, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          “{p.gloss}”
        </div>
      </div>

      {/* Answer */}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={!!result}
        placeholder={bi('Kirjoita tähän…', 'Write here…') as string}
        rows={2}
        style={{
          marginTop: 14, width: '100%', padding: '14px 16px', borderRadius: 'var(--r-md)',
          border: '1.5px solid var(--glass-line)', background: 'var(--glass)', resize: 'none',
          fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 16, color: 'var(--ink)', outline: 'none',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#C25B3F')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--glass-line)')}
      />

      {result && (
        <div className="ps-card" style={{ marginTop: 14, padding: 16,
          border: `1px solid ${result.ok ? 'var(--written)' : 'var(--glass-line)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: result.ok ? 'var(--written)' : 'var(--ink)' }}>
              {result.ok ? bi('Hienoa!', 'Great!') : bi('Näin sen voi sanoa', 'Here is a correct way')}
            </div>
            <SpeakerBtn reg="kirja" onClick={() => speak(result.corrected)} size={40} />
          </div>
          <div style={{ marginTop: 12 }}>
            <RegDot reg="kirja" />
            <div style={{ marginTop: 8 }}>
              <Sentence
                tokens={result.corrected === model ? p.kirja : result.corrected.split(/\s+/).map((t) => ({ t }))}
                font="var(--font-display)" weight={600} size={20} color="var(--ink)" />
            </div>
          </div>
          {result.comment && (
            <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10 }}>{result.comment}</p>
          )}
          {!result.ok && (
            <div className="ps-caption" style={{ marginTop: 10 }}>{bi('Sinä kirjoitit', 'You wrote')}: “{input.trim()}”</div>
          )}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 14 }} />

      {!result ? (
        <Btn variant="primary" block iconRight="arrow" disabled={busy || !input.trim()} onClick={() => void check()}>
          {busy ? (bi('Tarkistetaan…', 'Checking…')) : bi('Tarkista', 'Check')}
        </Btn>
      ) : (
        <Btn variant="primary" block iconRight="arrow" onClick={next}>{bi('Seuraava', 'Next')}</Btn>
      )}
    </ScreenScroll>
  )
}
