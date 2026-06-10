import { I } from './icons'
import { Bar } from './ui'
import { useLang } from '../lib/lang/useLang'
import { STAGES, journeyState } from '../lib/journey'

/* ---------------------------------------------------------------------------
 * The journey map: a vertical road from Launchpad (Stage 1) to North Star
 * (YKI B2). The current stage is opened up and shows its live requirement bars
 * (words + sentences); done stages are checked; the stages ahead are shown but
 * locked, so the whole path is legible. Driven by the real bank + sentence count.
 * ------------------------------------------------------------------------- */

function ReqBar({ fi, en, n, goal, pct, color }: {
  fi: string; en: string; n: number; goal: number; pct: number; color: string
}) {
  const { bilingual } = useLang()
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12.5, color: 'var(--ink)' }}>
          {fi}{bilingual && <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 500, color: 'var(--ink-3)', marginLeft: 6 }}>{en}</span>}
        </span>
        <span className="ps-num" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5, color: 'var(--ink-3)' }}>
          {n.toLocaleString()} / {goal.toLocaleString()}
        </span>
      </div>
      <Bar value={pct} color={color} track="var(--glass-deep)" h={7} />
    </div>
  )
}

export function Journey({ words, sentences }: { words: number; sentences: number }) {
  const { bilingual } = useLang()
  const st = journeyState(words, sentences)

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {STAGES.map((s, i) => {
        const last = i === STAGES.length - 1
        const now = s.n === st.current
        const done = s.n < st.current
        const locked = s.n > st.current
        return (
          <div key={s.n} style={{ display: 'flex', gap: 14 }}>
            {/* Rail */}
            <div style={{ width: 40, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: now ? 'var(--written)' : done ? 'var(--spoken-bg)' : 'var(--glass-deep)',
                color: now ? '#fff' : done ? 'var(--spoken)' : 'var(--ink-3)' }}>
                {done ? <I name="check" size={18} sw={2.2} /> : locked ? <I name="lock" size={15} sw={2} /> : <I name={s.icon} size={19} />}
              </span>
              {!last && <span style={{ flex: 1, width: 2, background: 'var(--glass-edge)', margin: '4px 0', minHeight: 20 }} />}
            </div>

            {/* Body */}
            <div style={{ flex: 1, minWidth: 0,
              background: now ? 'var(--written-bg)' : 'transparent',
              borderRadius: now ? 16 : 0,
              padding: now ? '13px 15px' : '3px 0 22px',
              marginTop: now ? -4 : 0, marginBottom: now ? 6 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="ps-label" style={{ color: now ? 'var(--written)' : 'var(--ink-3)' }}>
                      {`VAIHE ${s.n}`}
                    </span>
                    {now && (
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9.5, letterSpacing: '0.08em',
                        color: 'var(--written)', background: '#fff', borderRadius: 999, padding: '4px 9px' }}>
                        NYT{bilingual && <span style={{ fontWeight: 500, fontFamily: 'var(--font-body)', opacity: 0.7, marginLeft: 4 }}>now</span>}
                      </span>
                    )}
                    {s.northStar && (
                      <span style={{ color: locked ? 'var(--ink-3)' : 'var(--written)' }}><I name="star" size={13} sw={2} /></span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17,
                    color: now || done ? 'var(--ink)' : 'var(--ink-3)', marginTop: 3 }}>{s.fi}</div>
                  {bilingual && (
                    <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12.5, color: 'var(--ink-3)' }}>{s.en}</div>
                  )}
                </div>
                <span className="ps-num" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                  color: 'var(--ink-3)', flexShrink: 0, textAlign: 'right' }}>{s.cefr}</span>
              </div>

              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13.5, lineHeight: 1.4,
                color: now ? 'var(--ink-2)' : 'var(--ink-3)', margin: '8px 0 0', textWrap: 'pretty' }}>{s.blurb}</p>

              {/* The current stage opens up its live requirement bars */}
              {now && s.reqWords && s.reqSentences && (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <ReqBar fi="Sanat" en="Words" n={st.words} goal={s.reqWords} pct={st.wordPct} color="var(--written)" />
                  <ReqBar fi="Lauseet" en="Sentences" n={st.sentences} goal={s.reqSentences} pct={st.sentPct} color="var(--spoken)" />
                </div>
              )}

              {locked && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 10, color: 'var(--ink-3)' }}>
                  <I name="lock" size={13} sw={2} />
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5, color: 'var(--ink-2)' }}>
                    Avautuu edellisen vaiheen jälkeen
                    {bilingual && <span style={{ fontWeight: 500, color: 'var(--ink-3)', marginLeft: 5 }}>Unlocks after the stage before</span>}
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
