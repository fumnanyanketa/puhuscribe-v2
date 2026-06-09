import { I } from './icons'
import { useLang } from '../lib/lang/useLang'

/**
 * The learner's journey / north star: a visible path from first words to YKI,
 * so people always know where they are heading. Later stages are shown but
 * locked until the word bank reaches their threshold (orientation, not a wall).
 */
type StageDef = { key: string; icon: string; fi: string; en: string; desc: string; at: number }

const STAGES: StageDef[] = [
  { key: 'words',   icon: 'sparkle', fi: 'Ensimmäiset sanat',   en: 'First words',                desc: 'Recognise your first Finnish words in the Day One Sprint.',            at: 0 },
  { key: 'bank',    icon: 'cards',   fi: 'Kasvata sanavarastoa', en: 'Grow your word bank',        desc: 'Meet new words daily; spaced repetition locks them in.',                at: 1 },
  { key: 'speak',   icon: 'island',  fi: 'Puhu rohkeasti',       en: 'Speak with confidence',      desc: 'Say real-life sentences aloud, for the situations you will face.',      at: 50 },
  { key: 'fluency', icon: 'chart',   fi: 'Arjen sujuvuus',       en: 'Everyday fluency · B1',      desc: 'Hold everyday conversations. On track for YKI B1 (citizenship).',      at: 300 },
  { key: 'pro',     icon: 'flame',   fi: 'Työelämän suomi',      en: 'Professional Finnish · B2',  desc: 'Work and study in Finnish. YKI B2.',                                    at: 1500 },
]

export function Journey({ bankSize }: { bankSize: number }) {
  const { bi } = useLang()
  // The current stage is the highest one whose threshold the bank has reached.
  let current = 0
  for (let i = 0; i < STAGES.length; i++) if (bankSize >= STAGES[i].at) current = i

  return (
    <div>
      {STAGES.map((s, i) => {
        const status = i < current ? 'done' : i === current ? 'current' : 'locked'
        const last = i === STAGES.length - 1
        return (
          <div key={s.key} style={{ display: 'flex', gap: 14 }}>
            {/* Rail */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: status === 'current' ? 'var(--written)' : status === 'locked' ? 'var(--glass-deep)' : 'var(--written-bg)',
                color: status === 'current' ? '#fff' : status === 'locked' ? 'var(--ink-3)' : 'var(--written)',
                border: status === 'current' ? 'none' : '1px solid var(--glass-line)',
              }}>
                {status === 'done' ? <I name="check" size={18} /> : status === 'locked' ? <I name="lock" size={15} /> : <I name={s.icon} size={18} />}
              </div>
              {!last && <div style={{ flex: 1, width: 2, minHeight: 22, background: 'var(--glass-edge)', margin: '4px 0' }} />}
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingBottom: last ? 0 : 16, opacity: status === 'locked' ? 0.62 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15.5, lineHeight: 1.15 }}>{bi(s.fi, s.en)}</span>
                {status === 'current' && (
                  <span className="ps-label" style={{ color: 'var(--written)', background: 'var(--written-bg)', padding: '3px 9px', borderRadius: 999, fontSize: 9.5 }}>{bi('Nyt', 'now')}</span>
                )}
              </div>
              <div className="ps-caption" style={{ marginTop: 4 }}>{s.desc}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
