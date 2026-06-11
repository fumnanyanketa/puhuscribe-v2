import React from 'react'
import { BrandMark } from './primitives'
import { I } from './icons'
import { FeedbackButton } from './FeedbackButton'

/* ---------- Wordmark ---------- */
export function PuhuMark({ size = 20, light = false }: { size?: number; light?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <BrandMark size={size * 1.5} />
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

/* ---------- Bottom tab bar — identical across every hub screen ----------
   Meaningful icons (owner request): home=dashboard, book=learn/vocabulary,
   lines=your sentences, mic=practice, chart=progress. In-flow drills do NOT
   show the bar; they are modal tasks with a close/back button. */
const NAV = [
  { id: 'home',     icon: 'home'  },
  { id: 'learn',    icon: 'book'  },
  { id: 'islands',  icon: 'lines' },
  { id: 'practice', icon: 'mic'   },
  { id: 'progress', icon: 'chart' },
] as const

export type AppScreen =
  | 'onboarding' | 'home' | 'dayone' | 'learn' | 'daily' | 'islands'
  | 'practice' | 'listen' | 'read' | 'write' | 'progress' | 'insights'

export type NavTab = typeof NAV[number]['id']

export function BottomNav({ active, onNav }: { active: NavTab; onNav: (s: AppScreen) => void }) {
  return (
    <>
    <FeedbackButton screen={active} />
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40,
      paddingBottom: 18, paddingLeft: 18, paddingRight: 18, pointerEvents: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderRadius: 999, background: '#fff',
        boxShadow: 'var(--sh-2)', border: '1px solid var(--glass-line)', pointerEvents: 'auto' }}>
        {NAV.map((t) => {
          const on = active === t.id
          return (
            <button key={t.id} onClick={() => onNav(t.id)} aria-label={t.id} className="ps-press" style={{
              width: on ? 50 : 44, height: on ? 50 : 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: on ? 'var(--ink)' : 'transparent',
              color: on ? 'var(--on-dark)' : 'var(--ink-3)',
              transition: 'background .15s, color .15s, width .15s, height .15s',
            }}>
              <I name={t.icon} size={23} sw={on ? 2 : 1.8} />
            </button>
          )
        })}
      </div>
    </div>
    </>
  )
}
