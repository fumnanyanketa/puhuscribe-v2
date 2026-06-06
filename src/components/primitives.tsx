import React, { useId } from 'react'

/* ---------- Label ---------- */
export function Label({ children, color = 'var(--ink-3)', style }: {
  children: React.ReactNode
  color?: string
  style?: React.CSSProperties
}) {
  return <span className="ps-label" style={{ color, ...style }}>{children}</span>
}

/* ---------- Glossy speech bubble ---------- */
const BUBBLE = 'M28 10 H72 A20 20 0 0 1 92 30 V50 A20 20 0 0 1 72 70 H44 L24 88 L31 70 H28 A20 20 0 0 1 8 50 V30 A20 20 0 0 1 28 10 Z'

export function Orb({ size = 80, from = 'var(--orb-magenta)', to = 'var(--orb-violet)', dots = false, style }: {
  size?: number
  from?: string
  to?: string
  dots?: boolean
  style?: React.CSSProperties
}) {
  const uid = useId().replace(/[^a-z0-9]/gi, '')
  const g = 'bg' + uid, h = 'bh' + uid
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true"
      style={{ display: 'block', flexShrink: 0, filter: 'drop-shadow(0 9px 16px rgba(70,40,110,.30))', ...style }}>
      <defs>
        <radialGradient id={g} cx="34%" cy="26%" r="88%">
          <stop offset="0%" stopColor={to} />
          <stop offset="100%" stopColor={from} />
        </radialGradient>
        <radialGradient id={h} cx="32%" cy="22%" r="42%">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.72} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={BUBBLE} fill={`url(#${g})`} />
      <path d={BUBBLE} fill={`url(#${h})`} />
      {dots && (
        <g fill="#fff" fillOpacity={0.95}>
          <circle cx={34} cy={40} r={5} />
          <circle cx={50} cy={40} r={5} />
          <circle cx={66} cy={40} r={5} />
        </g>
      )}
    </svg>
  )
}

/* ---------- Speech-bubble cluster (hero imagery) ---------- */
export function OrbCluster({ size = 180, style }: { size?: number; style?: React.CSSProperties }) {
  const s = size
  return (
    <div aria-hidden="true" style={{ position: 'relative', width: s, height: s, ...style }}>
      <Orb size={s * 0.72} from="var(--orb-violet)" to="var(--orb-magenta)" dots
        style={{ position: 'absolute', left: s * 0.02, top: s * 0.20 }} />
      <Orb size={s * 0.5} from="var(--orb-magenta)" to="var(--orb-pink)"
        style={{ position: 'absolute', right: s * 0.0, top: s * 0.0 }} />
      <Orb size={s * 0.34} from="var(--orb-deep)" to="var(--orb-violet)"
        style={{ position: 'absolute', right: s * 0.14, bottom: s * 0.02 }} />
    </div>
  )
}

/* ---------- Register dot + label ---------- */
export function RegDot({ reg }: { reg: 'kirja' | 'puhe' }) {
  const isK = reg === 'kirja'
  const color = isK ? 'var(--written)' : 'var(--spoken)'
  return (
    <span className="ps-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {isK ? 'Kirjakieli' : 'Puhekieli'}
    </span>
  )
}

/* ---------- Sentence (flags azure-changed tokens) ---------- */
export interface Token { t: string; hot?: boolean }

export function Sentence({ tokens, font, weight, size, color, ls = '-0.02em' }: {
  tokens: Token[]
  font: string
  weight: number
  size: number
  color: string
  ls?: string
}) {
  return (
    <span style={{ fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.15, color, letterSpacing: ls }}>
      {tokens.map((tk, i) => (
        <React.Fragment key={i}>
          {tk.hot ? <span className="ps-hot">{tk.t}</span> : tk.t}
          {i < tokens.length - 1 ? ' ' : ''}
        </React.Fragment>
      ))}
    </span>
  )
}
