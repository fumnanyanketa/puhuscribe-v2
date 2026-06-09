import { useState } from 'react'
import { OrbCluster, Label, SkillChip } from '../components/primitives'
import { I } from '../components/icons'
import { ScreenScroll, AppScreen } from '../components/Shell'
import { useLang } from '../lib/lang/useLang'
import { YkiSkill } from '../lib/yki'
import { Speak } from './Speak'

type Item = { key: 'speak' | 'listen' | 'write'; icon: string; skill: YkiSkill; fi: string; en: string; desc: string }

const ITEMS: Item[] = [
  { key: 'speak',  icon: 'mic',     skill: 'speak',  fi: 'Puhu',      en: 'Speak',  desc: 'Hear a sentence, say it aloud, and record yourself.' },
  { key: 'listen', icon: 'speaker', skill: 'listen', fi: 'Kuuntele',  en: 'Listen', desc: 'Understand spoken Finnish by ear, then check yourself.' },
  { key: 'write',  icon: 'pencil',  skill: 'write',  fi: 'Kirjoita',  en: 'Write',  desc: 'Put a sentence into Finnish and get it checked.' },
]

export function Practice({ go }: { go: (s: AppScreen) => void }) {
  const { bi } = useLang()
  const [view, setView] = useState<'hub' | 'speak'>('hub')

  if (view === 'speak') return <Speak onBack={() => setView('hub')} />

  return (
    <ScreenScroll bottom={110}>
      <div>
        <Label color="var(--written)">Practice</Label>
        <h1 className="ps-title-1" style={{ marginTop: 8 }}>Harjoittele</h1>
        <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 8 }}>
          Train the four YKI skills, not just words. Reading comes through every card you review; speaking, listening and writing live here.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0 4px' }}>
        <OrbCluster size={120} />
      </div>

      <div style={{ display: 'grid', gap: 14, marginTop: 10 }}>
        {ITEMS.map((it) => (
          <button key={it.key} className="ps-press ps-card" onClick={() => it.key === 'speak' ? setView('speak') : go(it.key)} style={{
            padding: 18, cursor: 'pointer', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: 'var(--written-bg)',
              color: 'var(--written)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I name={it.icon} size={24} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>{bi(it.fi, it.en)}</span>
                <SkillChip skill={it.skill} />
              </div>
              <div className="ps-caption" style={{ marginTop: 3 }}>{it.desc}</div>
            </div>
            <span style={{ color: 'var(--ink-3)', flexShrink: 0 }}><I name="arrow" size={20} /></span>
          </button>
        ))}
      </div>
    </ScreenScroll>
  )
}
