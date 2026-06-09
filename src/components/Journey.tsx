import { I } from './icons'
import { SkillChip } from './primitives'
import { useLang } from '../lib/lang/useLang'
import { YkiSkill } from '../lib/yki'

/* ---------------------------------------------------------------------------
 * The learner's path as a vertical timeline (the design's "Your path" card):
 * five milestones from first words to YKI B2. Current stage highlighted on a
 * violet block, done stages checked, locked stages show their unlock. Driven
 * by the real vocabulary bank size.
 * ------------------------------------------------------------------------- */

type Mile = { fi: string; en: string; lvl: string; at: number; desc: string; skills: YkiSkill[] }

const MILES: Mile[] = [
  { fi: 'Ensimmäiset sanat', en: 'First words', lvl: 'A1', at: 0,
    desc: 'Recognise your first Finnish words by sight and sound.', skills: ['read', 'listen'] },
  { fi: 'Kasvata sanavarastoa', en: 'Grow your word bank', lvl: 'A1', at: 1,
    desc: 'Meet new words daily and start producing them; spaced repetition locks them in.', skills: ['read', 'write'] },
  { fi: 'Puhu rohkeasti', en: 'Speak with confidence', lvl: 'A2', at: 50,
    desc: 'Say and hear real-life sentences for the situations you will face.', skills: ['speak', 'listen'] },
  { fi: 'Arjen sujuvuus', en: 'Everyday fluency', lvl: 'B1', at: 300,
    desc: 'Hold everyday conversations across all four skills. YKI B1 (citizenship).', skills: ['speak', 'listen', 'read', 'write'] },
  { fi: 'Työelämän suomi', en: 'Professional Finnish', lvl: 'B2', at: 1500,
    desc: 'Work and study in Finnish. YKI B2.', skills: ['speak', 'listen', 'read', 'write'] },
]

export function Journey({ bankSize }: { bankSize: number }) {
  const { bilingual } = useLang()
  // The current stage is the highest one whose threshold the bank has reached.
  let current = 0
  for (let i = 0; i < MILES.length; i++) if (bankSize >= MILES[i].at) current = i

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {MILES.map((m, i) => {
        const last = i === MILES.length - 1
        const now = i === current
        const done = i < current
        const locked = i > current
        return (
          <div key={m.en} style={{ display: 'flex', gap: 14 }}>
            {/* Rail */}
            <div style={{ width: 36, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: now ? 'var(--written)' : done ? 'var(--spoken-bg)' : 'var(--glass-deep)',
                color: now ? '#fff' : done ? 'var(--spoken)' : 'var(--ink-3)' }}>
                {now ? <I name="sparkle" size={18} /> : done ? <I name="check" size={16} sw={2.2} /> : <I name="lock" size={15} sw={2} />}
              </span>
              {!last && <span style={{ flex: 1, width: 2, background: 'var(--glass-edge)', margin: '4px 0', minHeight: 18 }} />}
            </div>

            {/* Body */}
            <div style={{ flex: 1, minWidth: 0,
              background: now ? 'var(--written-bg)' : 'transparent',
              borderRadius: now ? 14 : 0,
              padding: now ? '12px 14px' : '0 0 22px',
              marginBottom: now ? 4 : 0, marginTop: now ? -6 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.8,
                      color: now || done ? 'var(--ink)' : 'var(--ink-3)' }}>{m.fi}</span>
                    {now && (
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9.5, letterSpacing: '0.08em',
                        color: 'var(--written)', background: '#fff', borderRadius: 999, padding: '4px 9px' }}>
                        NYT{bilingual && <span style={{ fontWeight: 500, fontFamily: 'var(--font-body)', opacity: 0.7, marginLeft: 4 }}>now</span>}
                      </span>
                    )}
                  </div>
                  {bilingual && (
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>{m.en}</div>
                  )}
                </div>
                <span className="ps-num" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--ink-3)', flexShrink: 0 }}>{m.lvl}</span>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13.5, lineHeight: 1.4,
                color: now ? 'var(--ink-2)' : 'var(--ink-3)', margin: '8px 0 0', textWrap: 'pretty' }}>{m.desc}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
                {m.skills.map((sk) => <SkillChip key={sk} skill={sk} />)}
              </div>
              {locked && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 10, color: 'var(--ink-3)' }}>
                  <I name="lock" size={13} sw={2} />
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--ink-2)' }}>
                    Avautuu {m.at} sanalla
                    {bilingual && <span style={{ fontWeight: 500, color: 'var(--ink-3)', marginLeft: 5 }}>Unlocks at {m.at} words</span>}
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
