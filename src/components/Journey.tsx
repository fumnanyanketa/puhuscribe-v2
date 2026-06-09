import { I } from './icons'
import { SkillChip } from './primitives'
import { useLang } from '../lib/lang/useLang'
import { YkiSkill } from '../lib/yki'

/**
 * The learner's journey / north star: a visible path from first words to YKI,
 * so people always know where they are heading. Each stage shows the YKI skills
 * it builds and a CEFR band; later stages are shown but locked until the word
 * bank reaches their threshold (orientation, not a wall).
 */
type StageDef = { key: string; icon: string; fi: string; en: string; desc: string; at: number; cefr: string; skills: YkiSkill[] }

const STAGES: StageDef[] = [
  { key: 'words',   icon: 'sparkle', fi: 'Ensimmäiset sanat',    en: 'First words',               desc: 'Recognise your first Finnish words by sight and sound.',                at: 0,    cefr: 'A1', skills: ['read', 'listen'] },
  { key: 'bank',    icon: 'cards',   fi: 'Kasvata sanavarastoa', en: 'Grow your word bank',       desc: 'Meet new words daily and start producing them; spaced repetition locks them in.', at: 1, cefr: 'A1', skills: ['read', 'write'] },
  { key: 'speak',   icon: 'island',  fi: 'Puhu rohkeasti',       en: 'Speak with confidence',     desc: 'Say and hear real-life sentences for the situations you will face.',     at: 50,   cefr: 'A2', skills: ['speak', 'listen'] },
  { key: 'fluency', icon: 'chart',   fi: 'Arjen sujuvuus',       en: 'Everyday fluency',          desc: 'Hold everyday conversations across all four skills. YKI B1 (citizenship).', at: 300,  cefr: 'B1', skills: ['speak', 'listen', 'read', 'write'] },
  { key: 'pro',     icon: 'flame',   fi: 'Työelämän suomi',      en: 'Professional Finnish',      desc: 'Work and study in Finnish. YKI B2.',                                    at: 1500, cefr: 'B2', skills: ['speak', 'listen', 'read', 'write'] },
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
                boxShadow: status === 'current' ? '0 0 0 4px var(--written-bg)' : 'none',
              }}>
                {status === 'done' ? <I name="check" size={18} /> : status === 'locked' ? <I name="lock" size={15} /> : <I name={s.icon} size={18} />}
              </div>
              {!last && <div style={{ flex: 1, width: 2, minHeight: 30, background: 'var(--glass-edge)', margin: '4px 0' }} />}
            </div>

            {/* Content */}
            <div style={{
              flex: 1, minWidth: 0, marginBottom: last ? 0 : 16, opacity: status === 'locked' ? 0.62 : 1,
              ...(status === 'current'
                ? { background: 'var(--written-bg)', borderRadius: 'var(--r-md)', padding: '10px 12px', marginTop: -4 }
                : {}),
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15.5, lineHeight: 1.15 }}>{bi(s.fi, s.en)}</span>
                  {status === 'current' && (
                    <span className="ps-label" style={{ color: 'var(--written)', background: '#fff', padding: '3px 9px', borderRadius: 999, fontSize: 9.5 }}>{bi('Nyt', 'now')}</span>
                  )}
                </div>
                <span className="ps-label ps-num" style={{ color: 'var(--ink-3)', flexShrink: 0, fontSize: 11 }}>{s.cefr}</span>
              </div>
              <div className="ps-caption" style={{ marginTop: 4 }}>{s.desc}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
                {s.skills.map((sk) => <SkillChip key={sk} skill={sk} />)}
              </div>
              {status === 'locked' && (
                <div className="ps-caption" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-3)' }}>
                  <I name="lock" size={12} /> {bi(`Avautuu ${s.at} sanalla`, `Unlocks at ${s.at} words`)}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
