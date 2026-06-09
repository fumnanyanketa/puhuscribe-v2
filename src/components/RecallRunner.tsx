import { useMemo, useState } from 'react'
import { BrandMark, RegDot, Sentence } from './primitives'
import { Bar, SpeakerBtn } from './ui'
import { I } from './icons'
import { CTA, ExBar, CenterLabel, Counter, FieldArea, StackLabel } from './kit'
import { ScreenScroll } from './Shell'
import { useLang } from '../lib/lang/useLang'
import { ReviewItem } from '../lib/data/review'
import { rateCard, previewIntervals } from '../lib/data/cards'
import { gradeAnswer, Grade } from '../lib/grade'
import { speak } from '../lib/tts'

/* ---------------------------------------------------------------------------
 * The active-recall engine, shared by both Daily Review tracks and the set
 * recall. The learner is shown the English and must PRODUCE the Finnish
 * (type it). The system grades it and applies the FSRS rating itself — the
 * learner never rates their own memory. "I don't know" counts as Again.
 * Graded state tints the whole screen by tier (the design's reward moment).
 * ------------------------------------------------------------------------- */

const TIER: Record<Grade['tier'], { fi: string; en: string; color: string; bg: string; icon: 'check' | 'close' }> = {
  correct: { fi: 'OIKEIN!',  en: 'Correct!',  color: 'var(--spoken)', bg: 'var(--spoken-bg)',        icon: 'check' },
  close:   { fi: 'MELKEIN',  en: 'Almost',    color: '#B5784A',       bg: 'rgba(181,120,74,.12)',    icon: 'check' },
  wrong:   { fi: 'EI AIVAN', en: 'Not quite', color: '#C2603F',       bg: 'rgba(194,96,63,.10)',     icon: 'close' },
}

/* "4d" → a human next-review phrase in both languages. */
function nextReview(code: string): { fi: string; en: string } {
  const m = code.match(/^(\d+)(mo|[mhdw])$/)
  if (!m) return { fi: code, en: code }
  const n = parseInt(m[1], 10)
  const unitFi: Record<string, string> = { m: 'minuutin', h: 'tunnin', d: 'päivän', w: 'viikon', mo: 'kuukauden' }
  const unitEn: Record<string, [string, string]> = {
    m: ['minute', 'minutes'], h: ['hour', 'hours'], d: ['day', 'days'], w: ['week', 'weeks'], mo: ['month', 'months'],
  }
  return {
    fi: `${n} ${unitFi[m[2]]} päästä`,
    en: `in ${n} ${unitEn[m[2]][n === 1 ? 0 : 1]}`,
  }
}

export function RecallRunner({ items, userId, titleFi, titleEn, onExit, onProgress }: {
  items: ReviewItem[]
  userId: string
  titleFi: string
  titleEn: string
  onExit: () => void
  onProgress?: () => void
}) {
  const { bi, biText, bilingual } = useLang()
  const [i, setI] = useState(0)
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState<Grade | null>(null)
  const [busy, setBusy] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [done, setDone] = useState(false)

  const item = items[i]
  const card = item.card
  const isWord = item.kind === 'word'
  const promptEn = isWord ? item.card.word.en : item.card.line.en
  const target = isWord ? item.card.word.fi : item.card.line.kirjaText
  const previews = useMemo(() => previewIntervals(card), [card])

  const play = () => { setPlaying(true); speak(target); setTimeout(() => setPlaying(false), isWord ? 1100 : 1600) }

  const grade = async (g: Grade) => {
    if (busy || result) return
    setBusy(true)
    setResult(g)
    if (g.tier !== 'wrong') setCorrect((c) => c + 1)
    try { await rateCard(userId, card, g.rating) } catch { /* schedule is retried next session */ }
    setBusy(false)
    play()
  }

  const check = () => { if (typed.trim() && !result) void grade(gradeAnswer(typed, target)) }
  const dunno = () => { if (!result) void grade(gradeAnswer('', target)) }

  const next = () => {
    setTyped(''); setResult(null); setPlaying(false)
    if (i < items.length - 1) setI(i + 1)
    else setDone(true)
  }

  if (done) {
    return (
      <ScreenScroll bottom={26}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          alignItems: 'center', textAlign: 'center', gap: 24 }}>
          <BrandMark size={140} />
          <div>
            <StackLabel fi="VALMIS" en="Done" color="var(--written)" style={{ marginBottom: 10 }} />
            <h2 className="ps-title-1">Hyvää työtä!</h2>
            <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10 }}>
              {correct} / {items.length} {bilingual ? <>oikein <span style={{ color: 'var(--ink-3)' }}>correct</span></> : 'oikein'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 320 }}>
            {onProgress && <CTA fi="Edistyminen" en="Progress" icon="chart" variant="light" flex="1" onClick={onProgress} />}
            <CTA fi="Takaisin" en="Back" iconRight="arrow" variant="ink" flex="1.2" onClick={onExit} />
          </div>
        </div>
      </ScreenScroll>
    )
  }

  const tier = result ? TIER[result.tier] : null
  const headColor = tier ? tier.color : 'var(--written)'

  return (
    <ScreenScroll bottom={26} bg={tier ? tier.bg : 'var(--bg-grad)'}>
      <ExBar nav="back" onNav={onExit}
        center={<CenterLabel fi={`KERTAUS · ${titleFi.toUpperCase()}`} en={`Review · ${titleEn}`} color={headColor} />}
        right={<Counter a={i + 1} b={items.length} />}>
        <Bar value={((i + (result ? 1 : 0)) / items.length) * 100} color={headColor} track="var(--glass-deep)" h={7} />
      </ExBar>

      {!result ? (
        <>
          {/* Prompt: produce the Finnish */}
          <div style={{ textAlign: 'center', marginTop: 26 }}>
            <StackLabel fi="KIRJOITA SUOMEKSI" en="Type it in Finnish" />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: isWord ? 30.2 : 23,
              letterSpacing: '-0.035em', lineHeight: 1.15, color: 'var(--ink)', marginTop: 24 }}>
              "{promptEn}"
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 12,
              padding: '7px 14px', borderRadius: 999, background: 'var(--written-bg)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--written)' }} />
              <span className="ps-label" style={{ color: 'var(--written)' }}>KIRJAKIELI</span>
            </div>
          </div>

          <div style={{ marginTop: 30 }}>
            <FieldArea value={typed} onChange={setTyped} placeholder={biText('Kirjoita tähän…', 'Type here')}
              rows={isWord ? 2 : 3} autoFocus disabled={busy} onEnter={check} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <CTA fi="En tiedä" en="I don't know" variant="light" flex="1" disabled={busy} onClick={dunno} />
            <CTA fi="Tarkista" en="Check" variant="ink" flex="1.4" disabled={busy || !typed.trim()} onClick={check} />
          </div>
          <div style={{ flex: 1, minHeight: 16 }} />
        </>
      ) : (
        <>
          {/* Graded: the tier takes over the screen */}
          <div style={{ textAlign: 'center', marginTop: 26 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <span style={{ width: 64, height: 64, borderRadius: '50%', background: tier!.color, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I name={tier!.icon} size={34} sw={2.6} />
              </span>
            </div>
            <StackLabel fi={tier!.fi} en={tier!.en} color={tier!.color} />
          </div>

          <div className="ps-card" style={{ marginTop: 22, padding: 24, borderRadius: 'var(--r-xl)',
            textAlign: isWord ? 'center' : 'left', border: `1.5px solid ${tier!.color}` }}>
            {isWord ? (
              <>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 31.7,
                  letterSpacing: '-0.04em', color: 'var(--ink)' }}>{item.kind === 'word' ? item.card.word.fi : ''}</div>
                {item.kind === 'word' && item.card.word.ipa && (
                  <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 15,
                    color: 'var(--written)', marginTop: 8 }}>{item.card.word.ipa}</div>
                )}
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15.8, color: 'var(--ink-2)', marginTop: 6 }}>
                  "{promptEn}"
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
                  <SpeakerBtn reg="kirja" playing={playing} onClick={play} size={46} />
                </div>
              </>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <RegDot reg="kirja" />
                    <div style={{ marginTop: 7 }}>
                      {item.kind === 'island' && (
                        <Sentence tokens={item.card.line.kirja} font="var(--font-display)" weight={600} size={21} color="var(--ink)" />
                      )}
                    </div>
                  </div>
                  <SpeakerBtn reg="kirja" playing={playing} onClick={play} size={44} />
                </div>
                {item.kind === 'island' && item.card.line.puheText && (
                  <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--spoken-bg)',
                    border: '1px solid var(--spoken-line)', borderRadius: 'var(--r-md)' }}>
                    <RegDot reg="puhe" />
                    <div style={{ marginTop: 7 }}>
                      <Sentence tokens={item.card.line.puhe} font="var(--font-body)" weight={600} size={16} color="var(--ink)" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <hr className="ps-rule" style={{ margin: '18px 0' }} />
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: 'var(--ink-2)',
              lineHeight: 1.5, textAlign: 'center' }}>
              Seuraava kertaus{' '}
              <strong style={{ color: tier!.color, fontWeight: 700 }}>{nextReview(previews[result.rating]).fi}</strong>
              {bilingual && (
                <span style={{ color: 'var(--ink-3)', display: 'block', marginTop: 2 }}>
                  Next review {nextReview(previews[result.rating]).en}
                </span>
              )}
            </div>
            {result.tier !== 'correct' && (
              <div className="ps-caption" style={{ marginTop: 12, textAlign: 'center' }}>
                {bi('Sinä kirjoitit', 'You wrote')}: "{typed.trim() || '…'}"
              </div>
            )}
          </div>

          <div style={{ flex: 1, minHeight: 16 }} />
          <CTA fi={i < items.length - 1 ? 'Jatka' : 'Valmis'} en={i < items.length - 1 ? 'Continue' : 'Finish'}
            iconRight="arrow" variant={result.tier === 'correct' ? 'spoken' : 'ink'} onClick={next} />
        </>
      )}
    </ScreenScroll>
  )
}
