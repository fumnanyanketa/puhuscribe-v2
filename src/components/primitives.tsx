import React, { useId } from 'react'
import { useLang } from '../lib/lang/useLang'
import { YKI, YkiSkill } from '../lib/yki'

/* ---------- Label ---------- */
export function Label({ children, color = 'var(--ink-3)', style }: {
  children: React.ReactNode
  color?: string
  style?: React.CSSProperties
}) {
  return <span className="ps-label" style={{ color, ...style }}>{children}</span>
}

/* ---------- Brand mark — "Sprout" logo tile ----------
   A rounded-square seedling in the cool orb gradient. Replaces the old
   speech-bubble cluster as the app's brand mark (the owner-chosen direction).
   Belongs at entry/brand moments (Auth, Welcome, Home); kept small or absent
   inside focused drills so a task never looks like a logo showcase. */
export function BrandMark({ size = 80, style }: { size?: number; style?: React.CSSProperties }) {
  const uid = useId().replace(/[^a-z0-9]/gi, '')
  const gV = 'bmv' + uid, gl = 'bml' + uid
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true"
      style={{ display: 'block', flexShrink: 0, ...style }}>
      <defs>
        <linearGradient id={gV} x1="12%" y1="4%" x2="82%" y2="96%">
          <stop offset="0%" stopColor="var(--orb-violet)" />
          <stop offset="100%" stopColor="var(--orb-deep)" />
        </linearGradient>
        <radialGradient id={gl} cx="34%" cy="26%" r="58%">
          <stop offset="0%" stopColor="rgba(255,255,255,.6)" />
          <stop offset="62%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <rect x={8} y={8} width={84} height={84} rx={26} fill={`url(#${gV})`} />
      <path d="M50 78 L50 50" stroke="#fff" strokeWidth={5} strokeLinecap="round" fill="none" />
      <path d="M50 62 C 50 45 37 39 23 41 C 25 58 40 65 50 62 Z" fill="rgba(255,255,255,.96)" />
      <path d="M50 55 C 50 41 63 36 77 38 C 75 53 60 59 50 55 Z" fill="rgba(255,255,255,.80)" />
      <rect x={14} y={14} width={46} height={30} rx={16} fill={`url(#${gl})`} />
    </svg>
  )
}

/* ---------- Glossy disc — neutral decorative accent (replaces the bubble Orb) ---------- */
export function Disc({ size = 80, from = 'var(--orb-pink)', to = 'var(--orb-violet)', style }: {
  size?: number
  from?: string
  to?: string
  style?: React.CSSProperties
}) {
  const uid = useId().replace(/[^a-z0-9]/gi, '')
  const gd = 'dsc' + uid, gl = 'dgl' + uid
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true"
      style={{ display: 'block', flexShrink: 0, ...style }}>
      <defs>
        <linearGradient id={gd} x1="15%" y1="8%" x2="85%" y2="92%">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <radialGradient id={gl} cx="34%" cy="26%" r="58%">
          <stop offset="0%" stopColor="rgba(255,255,255,.6)" />
          <stop offset="62%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <circle cx={50} cy={50} r={44} fill={`url(#${gd})`} />
      <ellipse cx={37} cy={31} rx={20} ry={13} fill={`url(#${gl})`} />
    </svg>
  )
}

/* Back-compat aliases — every screen imports Orb / OrbCluster. Orb is now a
   glossy Disc; OrbCluster renders the Sprout BrandMark. Keeping the names means
   the new brand applies across every screen at once, without touching imports. */
export function Orb({ size = 80, from, to, style }: {
  size?: number
  from?: string
  to?: string
  dots?: boolean
  style?: React.CSSProperties
}) {
  return <Disc size={size} from={from} to={to} style={style} />
}

export function OrbCluster({ size = 96, style }: { size?: number; style?: React.CSSProperties }) {
  return <BrandMark size={size} style={style} />
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

/* ---------- YKI skill chip (which of the four skills an activity trains) ---------- */
export function SkillChip({ skill, style }: { skill: YkiSkill; style?: React.CSSProperties }) {
  const { bilingual } = useLang()
  const s = YKI[skill]
  return (
    <span className="ps-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
      color: s.color, background: s.bg, padding: '4px 9px', borderRadius: 999, fontSize: 9.5, ...style }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      {bilingual ? s.en : s.fi}
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
