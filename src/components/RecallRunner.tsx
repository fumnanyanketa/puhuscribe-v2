import { useMemo, useState } from 'react'
import { OrbCluster, Label, RegDot, Sentence } from './primitives'
import { Btn, IconBtn, Steps, SpeakerBtn } from './ui'
import { ScreenScroll } from './Shell'
import { useLang } from '../lib/lang/useLang'
import { ReviewItem } from '../lib/data/review'
import { rateCard, previewIntervals } from '../lib/data/cards'
import { gradeAnswer, Grade } from '../lib/grade'
import { speak } from '../lib/tts'

/* ---------------------------------------------------------------------------
 * The active-recall engine, shared by both Daily tracks and the island Recall.
 * The learner is shown the English and must PRODUCE the Finnish (type it). The
 * system grades it and applies the FSRS rating itself — the learner never rates
 * their own memory, so they can't fudge it. An "I don't know" counts as Again.
 * ------------------------------------------------------------------------- */

const TIER: Record<Grade['tier'], { fi: string; en: string; color: string; bg: string }> = {
  correct: { fi: 'Oikein!',  en: 'Correct',   color: 'var(--written)', bg: 'rgba(107,70,193,.12)' },
  close:   { fi: 'Melkein',  en: 'Almost',    color: 'var(--sauna)',   bg: 'rgba(181,120,74,.14)' },
  wrong:   { fi: 'Ei aivan', en: 'Not quite', color: 'var(--flag)',    bg: 'var(--flag-bg)' },
}

export function RecallRunner({ items, userId, titleFi, titleEn, onExit, onProgress }: {
  items: ReviewItem[]
  userId: string
  titleFi: string
  titleEn: string
  onExit: () => void
  onProgress?: () => void
}) {
  const { bi, biText } = useLang()
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
  const dunno = () => { if (!result) void grade(gradeAnswer('', target)) } // empty -> wrong -> Again

  const next = () => {
    setTyped(''); setResult(null); setPlaying(false)
    if (i < items.length - 1) setI(i + 1)
    else setDone(true)
  }

  if (done) return (
    <ScreenScroll bottom={110}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 24 }}>
        <OrbCluster size={190} />
        <div>
          <Label color="var(--written)" style={{ display: 'block', marginBottom: 10 }}>{bi('Valmis', 'Done')}</Label>
          <h2 className="ps-title-1">{bi('Hyvää työtä!', 'Good work.')}</h2>
          <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10 }}>{correct} / {items.length} {bi('oikein', 'correct')}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {onProgress && <Btn variant="light" icon="chart" onClick={onProgress}>{bi('Edistyminen', 'Progress')}</Btn>}
          <Btn variant="primary" iconRight="arrow" onClick={onExit}>{bi('Takaisin', 'Back')}</Btn>
        </div>
      </div>
    </ScreenScroll>
  )

  const tier = result ? TIER[result.tier] : null

  return (
    <ScreenScroll bottom={110}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconBtn icon="arrowL" tone="glass" size={40} onClick={onExit} />
        <Label color={isWord ? 'var(--written)' : 'var(--spoken)'}>{bi(titleFi, titleEn)}</Label>
        <span style={{ width: 40 }} />
      </div>

      <div style={{ marginTop: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Steps total={items.length} current={i} />
        <span className="ps-label ps-num" style={{ color: 'var(--ink-2)', flexShrink: 0 }}>{i + 1}/{items.length}</span>
      </div>

      {/* Prompt: the English meaning */}
      <div className="ps-glass" style={{ padding: 22, borderRadius: 'var(--r-2xl)' }}>
        <Label color={isWord ? 'var(--written)' : 'var(--spoken)'}>{bi('Kirjoita suomeksi', 'Write it in Finnish')}</Label>
        <div style={{ marginTop: 12, fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: isWord ? 30 : 23, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          {promptEn}
        </div>
      </div>

      {/* Answer input */}
      <textarea
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        disabled={!!result}
        autoFocus
        placeholder={biText('Suomeksi…', 'In Finnish…')}
        rows={isWord ? 2 : 3}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !result) { e.preventDefault(); check() } }}
        style={{
          marginTop: 14, width: '100%', padding: '14px 16px', borderRadius: 'var(--r-md)',
          border: `1.5px solid ${tier ? tier.color : 'var(--glass-line)'}`, background: 'var(--glass)', resize: 'none',
          fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--ink)', outline: 'none',
        }}
      />

      {/* Actions sit directly under the input so they stay reachable above the
          on-screen keyboard, instead of being pinned below the fold. */}
      {!result ? (
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <Btn variant="light" style={{ flex: 1 }} disabled={busy} onClick={dunno}>{bi('En tiedä', "I don't know")}</Btn>
          <Btn variant="primary" style={{ flex: 1.4 }} iconRight="arrow" disabled={busy || !typed.trim()} onClick={check}>{bi('Tarkista', 'Check')}</Btn>
        </div>
      ) : (
        <>
          {tier && (
            <div className="ps-card" style={{ marginTop: 14, padding: 16, border: `1px solid ${tier.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: tier.color }}>{bi(tier.fi, tier.en)}</span>
                <span className="ps-num" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{bi('Seuraava', 'Next')}: {previews[result.rating]}</span>
              </div>

              <div style={{ marginTop: 12 }}>
                {isWord ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34, letterSpacing: '-0.03em', lineHeight: 1 }}>{item.kind === 'word' ? item.card.word.fi : ''}</div>
                      {item.kind === 'word' && item.card.word.ipa && (
                        <div className="ps-num" style={{ marginTop: 6, fontSize: 15, color: 'var(--written)', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' }}>{item.card.word.ipa}</div>
                      )}
                    </div>
                    <SpeakerBtn reg="kirja" playing={playing} onClick={play} size={46} />
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <RegDot reg="kirja" />
                        <div style={{ marginTop: 7 }}>
                          {item.kind === 'island' && <Sentence tokens={item.card.line.kirja} font="var(--font-display)" weight={600} size={21} color="var(--ink)" />}
                        </div>
                      </div>
                      <SpeakerBtn reg="kirja" playing={playing} onClick={play} size={44} />
                    </div>
                    {item.kind === 'island' && item.card.line.puheText && (
                      <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--spoken-bg)', border: '1px solid var(--spoken-line)', borderRadius: 'var(--r-md)' }}>
                        <RegDot reg="puhe" />
                        <div style={{ marginTop: 7 }}>
                          <Sentence tokens={item.card.line.puhe} font="var(--font-body)" weight={600} size={16} color="var(--ink)" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {result.tier !== 'correct' && (
                <div className="ps-caption" style={{ marginTop: 12 }}>{bi('Sinä kirjoitit', 'You wrote')}: “{typed.trim() || '—'}”</div>
              )}
            </div>
          )}
          <Btn variant="primary" block iconRight="arrow" style={{ marginTop: 14 }} onClick={next}>{i < items.length - 1 ? bi('Seuraava', 'Next') : bi('Valmis', 'Finish')}</Btn>
        </>
      )}
    </ScreenScroll>
  )
}
