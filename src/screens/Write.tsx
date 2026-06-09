import { useMemo, useState } from 'react'
import { BrandMark, RegDot, Sentence } from '../components/primitives'
import { Bar, SpeakerBtn } from '../components/ui'
import { CTA, ExBar, CenterLabel, Counter, FieldArea, StackLabel } from '../components/kit'
import { ScreenScroll, AppScreen } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'
import { fetchGradedSentences, levelForBank, RegisterSentence } from '../lib/data/content'
import { fetchProgressStats } from '../lib/data/stats'
import { bumpPracticeCount } from '../lib/practiceStats'
import { getWritingFeedback, speak } from '../lib/tts'

/* ---------------------------------------------------------------------------
 * Writing practice — translate an everyday sentence into Finnish. Checked by
 * Claude (the Worker /correct route) when configured, with a model-answer
 * self-check fallback. Hint chips offer the model answer's words, shuffled.
 * ------------------------------------------------------------------------- */

const WRITE_COLOR = '#C2603F'

type Loaded = { sentences: RegisterSentence[]; level: string }
type Result = { ok: boolean; corrected: string; comment: string }

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFC').replace(/[^\p{L}\s]/gu, '').replace(/\s+/g, ' ').trim()
}

export function Write({ go }: { go: (s: AppScreen) => void }) {
  const { user } = useAuth()
  const { bi } = useLang()
  const { data, loading, error } = useAsync<Loaded>(
    async () => {
      const bank = user ? (await fetchProgressStats(user.id)).totalCards : 0
      const sentences = await fetchGradedSentences(bank, 8)
      return { sentences, level: levelForBank(bank) }
    },
    [user?.id],
  )

  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={26} />
  if (error) return <StatePane tone="error" title="Couldn't load writing" detail={error} bottom={26} />
  if (!data || data.sentences.length === 0) return <StatePane title={bi('Ei lauseita vielä', 'No sentences yet')} detail="No sentences available yet." bottom={26} />

  return <WriteSession key={data.sentences.map((s) => s.id).join(',')} sentences={data.sentences} go={go} />
}

function WriteSession({ sentences, go }: { sentences: RegisterSentence[]; go: (s: AppScreen) => void }) {
  const { bilingual, biText } = useLang()
  const [i, setI] = useState(0)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [done, setDone] = useState(false)

  const p = sentences[i]
  const model = p.kirja.map((t) => t.t).join(' ')

  // Hint chips: the model answer's words, deterministically shuffled.
  const hints = useMemo(() => {
    const ws = model.replace(/[.?!,]/g, '').split(/\s+/).filter(Boolean)
    return [...ws].sort((a, b) => ((a.charCodeAt(0) * 7 + i) % 5) - ((b.charCodeAt(0) * 7 + i) % 5))
  }, [model, i])

  const check = async () => {
    const text = input.trim()
    if (!text || busy) return
    setBusy(true)
    const fb = await getWritingFeedback(p.gloss, text)
    if (fb.configured) {
      setResult({ ok: fb.ok, corrected: fb.corrected || model, comment: fb.comment || '' })
    } else {
      const match = normalize(text) === normalize(model)
      setResult({ ok: match, corrected: model, comment: '' })
    }
    setBusy(false)
  }

  const next = () => {
    if (i < sentences.length - 1) { setI(i + 1); setInput(''); setResult(null) }
    else { bumpPracticeCount('write'); setDone(true) }
  }

  if (done) {
    return (
      <ScreenScroll bottom={26}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          alignItems: 'center', textAlign: 'center', gap: 24 }}>
          <BrandMark size={140} />
          <div>
            <StackLabel fi="KIRJOITUS VALMIS" en="Writing complete" color={WRITE_COLOR} style={{ marginBottom: 10 }} />
            <h2 className="ps-title-1">Hyvää työtä!</h2>
            <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10, maxWidth: 300 }}>
              Writing is the skill most apps skip. Every sentence you produce makes the rest stick.
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
        center={<CenterLabel fi="KIRJOITTAMINEN" en="Writing" color={WRITE_COLOR} />}
        right={<Counter a={i + 1} b={sentences.length} />}>
        <Bar value={((i + 1) / sentences.length) * 100} color={WRITE_COLOR} track="var(--glass-deep)" h={7} />
      </ExBar>

      <div style={{ marginTop: 22 }}>
        <StackLabel fi="KIRJOITA SUOMEKSI" en="Write it in Finnish" />
      </div>

      {/* Prompt */}
      <div className="ps-card" style={{ marginTop: 16, padding: '18px 20px', borderRadius: 'var(--r-lg)', background: 'var(--written-bg)' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13, color: 'var(--ink-3)', marginBottom: 6 }}>
          Käännä{bilingual && <span> · Translate</span>}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17.2,
          letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.2 }}>
          "{p.gloss}"
        </div>
      </div>

      {/* Answer */}
      <div style={{ marginTop: 18 }}>
        <FieldArea value={input} onChange={setInput} rows={2} disabled={!!result}
          placeholder={biText('Kirjoita tähän…', 'Write here')}
          tone={result ? (result.ok ? 'var(--spoken)' : WRITE_COLOR) : undefined}
          onEnter={() => void check()} />
      </div>

      {/* Hint chips: the words you need, shuffled */}
      {!result && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {hints.map((w, k) => (
            <button key={w + k} className="ps-press" onClick={() => setInput((v) => (v ? v.replace(/\s+$/, '') + ' ' : '') + w)}
              style={{ padding: '9px 15px', borderRadius: 999, background: '#fff', boxShadow: 'var(--sh-1)',
                border: '1px solid var(--glass-line)', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
              {w}
            </button>
          ))}
        </div>
      )}

      {result && (
        <div className="ps-card" style={{ marginTop: 14, padding: 16,
          border: `1.5px solid ${result.ok ? 'var(--spoken)' : 'var(--glass-line)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: result.ok ? 'var(--spoken)' : 'var(--ink)' }}>
              {result.ok ? 'Hienoa!' : 'Näin sen voi sanoa'}
              {bilingual && (
                <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 500,
                  fontSize: 11.5, color: 'var(--ink-3)' }}>
                  {result.ok ? 'Great!' : 'Here is a correct way'}
                </span>
              )}
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
            <div className="ps-caption" style={{ marginTop: 10 }}>Sinä kirjoitit: "{input.trim()}"</div>
          )}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 14 }} />

      {!result ? (
        <CTA fi={busy ? 'Tarkistetaan…' : 'Tarkista'} en={busy ? 'Checking' : 'Check'} variant="ink"
          disabled={busy || !input.trim()} onClick={() => void check()} />
      ) : (
        <CTA fi="Seuraava" en="Next" iconRight="arrow" variant="ink" onClick={next} />
      )}
    </ScreenScroll>
  )
}
