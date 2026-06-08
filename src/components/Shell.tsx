import React from 'react'
import { Orb } from './primitives'
import { I } from './icons'

/* ---------- Wordmark ---------- */
export function PuhuMark({ size = 20, light = false }: { size?: number; light?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <Orb size={size * 1.15} from="var(--orb-magenta)" to="var(--orb-violet)" dots />
      <span style={{
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size,
        letterSpacing: '-0.03em', color: light ? 'var(--on-dark)' : 'var(--ink)',
      }}>
        Puhu<span style={{ opacity: 0.55 }}>Scribe</span>
      </span>
    </div>
  )
}

/* ---------- Scrollable screen body ---------- */
export function ScreenScroll({ children, pad = 22, bottom = 22, bg = 'var(--bg-grad)', style }: {
  children: React.ReactNode
  pad?: number
  bottom?: number
  bg?: string
  style?: React.CSSProperties
}) {
  return (
    <div className="ps-noscroll" style={{
      position: 'absolute', inset: 0, overflowY: 'auto', background: bg,
      paddingTop: 56, paddingLeft: pad, paddingRight: pad, paddingBottom: bottom,
      display: 'flex', flexDirection: 'column', ...style,
    }}>
      {children}
    </div>
  )
}

/* ---------- Floating frosted pill nav ---------- */
const NAV = [
  { id: 'dayone',   icon: 'sparkle' },
  { id: 'daily',    icon: 'cards'  },
  { id: 'island',   icon: 'island' },
  { id: 'progress', icon: 'chart'  },
] as const

export type AppScreen = 'onboarding' | 'dayone' | 'daily' | 'island' | 'progress'

export function BottomNav({ active, onNav }: { active: AppScreen; onNav: (s: AppScreen) => void }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40,
      paddingBottom: 26, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div className="ps-glass" style={{ display: 'flex', gap: 8, padding: 8, borderRadius: 999,
        background: 'var(--glass-2)', boxShadow: 'var(--sh-2)', pointerEvents: 'auto' }}>
        {NAV.map((t) => {
          const on = active === t.id
          return (
            <button key={t.id} onClick={() => onNav(t.id)} aria-label={t.id} className="ps-press" style={{
              width: 58, height: 58, borderRadius: '50%', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: on ? 'var(--ink)' : 'transparent',
              color: on ? 'var(--on-dark)' : 'var(--ink-2)',
              transition: 'background .15s, color .15s',
            }}>
              <I name={t.icon as any} size={24} sw={on ? 2 : 1.8} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
