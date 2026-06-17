import { useState } from 'react'
import { Bar } from '../components/ui'
import { I } from '../components/icons'
import { HubHeader, IconTile, Gloss } from '../components/kit'
import { ScreenScroll, AppScreen, BottomNav } from '../components/Shell'
import { YKI, YkiSkill } from '../lib/yki'
import { getPracticeCounts, PRACTICE_GOAL } from '../lib/practiceStats'
import { Speak } from './Speak'

const BODY_BOTTOM = 96

type Item = { skill: YkiSkill; fi: string; en: string; icon: string; desc: string }

const ITEMS: Item[] = [
  { skill: 'speak',  fi: 'Puhuminen',       en: 'Speaking',  icon: 'mic',    desc: 'Say real sentences out loud and hear yourself back.' },
  { skill: 'listen', fi: 'Kuunteleminen',   en: 'Listening', icon: 'volume', desc: 'Hear real Finnish and show you understood.' },
  { skill: 'read',   fi: 'Lukeminen',       en: 'Reading',   icon: 'eye',    desc: 'Read short sentences from everyday life.' },
  { skill: 'write',  fi: 'Kirjoittaminen',  en: 'Writing',   icon: 'pen',    desc: 'Write your own sentences and get them checked.' },
]

export function Practice({ go }: { go: (s: AppScreen) => void }) {
  const [view, setView] = useState<'hub' | 'speak'>('hub')

  if (view === 'speak') return <Speak onBack={() => setView('hub')} />

  const counts = getPracticeCounts()
  const nav = <BottomNav active="practice" onNav={go} />

  const open = (skill: YkiSkill) => {
    if (skill === 'speak') setView('speak')
    else if (skill === 'listen') go('listen')
    else if (skill === 'read') go('read')
    else go('write')
  }

  return (
    <>
    <ScreenScroll bottom={BODY_BOTTOM} style={{ paddingTop: 62 }}>
      <HubHeader eyebrowFi="PRACTICE" title="Harjoittele"
        sub="The four skills the YKI test measures. Train each one in real situations." />

      {/* Featured: a real conversation in Finnish (the FLOW stage). The most
          important kind of speaking practice, so it leads the page. */}
      <button onClick={() => go('converse')} className="ps-press" style={{
        marginTop: 20, width: '100%', padding: 18, borderRadius: 'var(--r-xl)', cursor: 'pointer',
        textAlign: 'left', border: 'none', overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(150deg, var(--spoken), #166372)',
        boxShadow: '0 18px 36px -16px rgba(31,124,142,.6)', color: '#fff',
        display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ width: 48, height: 48, borderRadius: 15, flexShrink: 0,
          background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I name="chat" size={24} sw={2} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>
            Keskustele suomeksi
          </span>
          <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13,
            color: 'rgba(255,255,255,.85)', marginTop: 2 }}>
            Have a real chat in Finnish with your tutor. Speak first, perfect later.
          </span>
        </span>
        <span style={{ flexShrink: 0 }}><I name="arrow" size={22} sw={2} /></span>
      </button>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ITEMS.map((it) => {
          const c = YKI[it.skill]
          const done = Math.min(counts[it.skill], PRACTICE_GOAL)
          return (
            <button key={it.skill} className="ps-card ps-press" onClick={() => open(it.skill)} style={{
              padding: 16, borderRadius: 'var(--r-lg)', width: '100%', textAlign: 'left',
              border: 'none', cursor: 'pointer',
            }}>
              <span style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <IconTile icon={it.icon} color={c.color} bg={c.bg} />
                <span style={{ flex: 1, minWidth: 0, display: 'block' }}>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.5, color: 'var(--ink)' }}>{it.fi}</span>
                    <Gloss>{it.en}</Gloss>
                  </span>
                  <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13.5,
                    lineHeight: 1.4, color: 'var(--ink-2)', marginTop: 4, textWrap: 'pretty' }}>{it.desc}</span>
                </span>
                <span style={{ color: 'var(--ink-3)', flexShrink: 0 }}><I name="arrow" size={20} sw={2} /></span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
                <span style={{ flex: 1 }}>
                  <Bar value={(done / PRACTICE_GOAL) * 100} color={c.color} track="var(--glass-deep)" h={6} />
                </span>
                <span className="ps-num" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5, color: 'var(--ink-3)', flexShrink: 0 }}>
                  {done}/{PRACTICE_GOAL}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </ScreenScroll>
    {nav}
    </>
  )
}
