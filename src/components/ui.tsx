import React from 'react'
import { I } from './icons'

/* ---------- Button ---------- */
type BtnVariant = 'primary' | 'light' | 'accent' | 'rose' | 'ghost'

export function Btn({ variant = 'primary', block = false, sm = false, icon, iconRight, children, style, onClick, disabled }: {
  variant?: BtnVariant
  block?: boolean
  sm?: boolean
  icon?: string
  iconRight?: string
  children?: React.ReactNode
  style?: React.CSSProperties
  onClick?: () => void
  disabled?: boolean
}) {
  const cls = `ps-btn ps-btn--${variant}${block ? ' ps-btn--block' : ''}${sm ? ' ps-btn--sm' : ''}`
  const sz = sm ? 18 : 20
  return (
    <button className={cls} style={style} onClick={onClick} disabled={disabled}>
      {icon && <I name={icon as any} size={sz} />}
      {children}
      {iconRight && <I name={iconRight as any} size={sz} />}
    </button>
  )
}

/* ---------- Circular icon button ---------- */
type IconBtnTone = 'glass' | 'ink' | 'solid'

export function IconBtn({ icon, onClick, size = 44, tone = 'glass', style, label }: {
  icon: string
  onClick?: () => void
  size?: number
  tone?: IconBtnTone
  style?: React.CSSProperties
  label?: string
}) {
  const tones: Record<IconBtnTone, React.CSSProperties> = {
    glass:  { background: 'var(--glass-3)', color: 'var(--ink)',     border: '1px solid var(--glass-line)' },
    ink:    { background: 'var(--ink)',     color: 'var(--on-dark)', border: 'none' },
    solid:  { background: '#fff',           color: 'var(--ink)',     border: 'none' },
  }
  return (
    <button onClick={onClick} aria-label={label || icon} className="ps-press" style={{
      width: size, height: size, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: 'var(--sh-1)', ...tones[tone], ...style,
    }}>
      <I name={icon as any} size={size * 0.42} />
    </button>
  )
}

/* ---------- Speaker / audio button ---------- */
export function SpeakerBtn({ reg = 'kirja', playing = false, onClick, size = 42 }: {
  reg?: 'kirja' | 'puhe'
  playing?: boolean
  onClick?: () => void
  size?: number
}) {
  const color = reg === 'kirja' ? 'var(--written)' : 'var(--spoken)'
  return (
    <button onClick={onClick} className="ps-press" aria-label="Play audio" style={{
      width: size, height: size, borderRadius: '50%', border: 'none', flexShrink: 0, cursor: 'pointer',
      background: playing ? color : '#fff', color: playing ? '#fff' : color,
      boxShadow: 'var(--sh-1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background .15s, color .15s',
    }}>
      <I name="play" size={size * 0.42} />
    </button>
  )
}

/* ---------- Progress bar ---------- */
export function Bar({ value, color = 'var(--written)', track = 'var(--glass-deep)', h = 9, style }: {
  value: number
  color?: string
  track?: string
  h?: number
  style?: React.CSSProperties
}) {
  return (
    <div style={{ height: h, borderRadius: 999, background: track, overflow: 'hidden', ...style }}>
      <div style={{
        width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', borderRadius: 999,
        background: color, transition: 'width .5s cubic-bezier(.2,.7,.3,1)',
      }} />
    </div>
  )
}

/* ---------- Counter ring (SVG circular progress) ---------- */
export function Ring({ value, max, size = 124, stroke = 11, color = 'var(--written)', track = 'rgba(255,255,255,.4)', children }: {
  value: number
  max: number
  size?: number
  stroke?: number
  color?: string
  track?: string
  children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value / max))
  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.7,.3,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        {children}
      </div>
    </div>
  )
}

/* ---------- Switch toggle ---------- */
export function Toggle({ on, onChange, label }: {
  on: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label}
      onClick={() => onChange(!on)} className="ps-press" style={{
        width: 50, height: 30, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0,
        padding: 3, background: on ? 'var(--ink)' : 'var(--glass-deep)',
        display: 'flex', alignItems: 'center', justifyContent: on ? 'flex-end' : 'flex-start',
        transition: 'background .18s ease',
      }}>
      <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#fff', boxShadow: 'var(--sh-1)' }} />
    </button>
  )
}

/* ---------- Step segments ---------- */
export function Steps({ total, current, color = 'var(--ink)' }: {
  total: number
  current: number
  color?: string
}) {
  return (
    <div style={{ display: 'flex', gap: 6, flex: 1 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{
          height: 6, flex: i === current ? 2.4 : 1, borderRadius: 999,
          background: i <= current ? color : 'var(--glass-deep)',
          transition: 'all .3s ease',
        }} />
      ))}
    </div>
  )
}
