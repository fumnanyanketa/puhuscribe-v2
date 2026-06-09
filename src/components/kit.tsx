import React, { useState } from 'react'
import { I } from './icons'
import { Bar, Steps } from './ui'
import { useLang } from '../lib/lang/useLang'

/* ---------------------------------------------------------------------------
 * Shared app chrome from the Claude Design handoff ("PuhuScribe App Screens").
 * Everything every screen shares lives here, so screens that teach the same
 * thing are guaranteed to look alike. The bilingual pattern throughout:
 * Finnish primary, English as a quiet muted italic secondary, no brackets.
 * English lines collapse away in Finnish-only mode (useLang).
 * ------------------------------------------------------------------------- */

/* ---- Eyebrow: uppercase FI label with the EN gloss tucked beneath ---- */
export function Eyebrow({ fi, en, color = 'var(--written)', center = false, style }: {
  fi: string; en?: string; color?: string; center?: boolean; style?: React.CSSProperties
}) {
  const { bilingual } = useLang()
  return (
    <div style={{ textAlign: center ? 'center' : 'left', ...style }}>
      <span className="ps-label" style={{ color, display: 'block' }}>{fi}</span>
      {en && bilingual && (
        <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 500,
          fontSize: 10.5, letterSpacing: '0.01em', color: 'var(--ink-3)', display: 'block', marginTop: 1 }}>
          {en}
        </span>
      )}
    </div>
  )
}

/* ---- Inline EN gloss after FI text: muted italic, no brackets ---- */
export function Gloss({ children, size = 12 }: { children: React.ReactNode; size?: number }) {
  const { bilingual } = useLang()
  if (!bilingual) return null
  return (
    <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 500,
      fontSize: size, color: 'var(--ink-3)' }}>
      {children}
    </span>
  )
}

/* ---- Full-width pill CTA with the stacked bilingual label ---- */
export type CTAVariant = 'ink' | 'accent' | 'spoken' | 'light'

const CTA_THEMES: Record<CTAVariant, { background: string; color: string; shadow: string; border?: string }> = {
  ink:    { background: 'var(--ink)',     color: 'var(--on-dark)', shadow: '0 10px 24px -8px rgba(27,26,32,.45)' },
  accent: { background: 'var(--written)', color: '#fff',           shadow: '0 10px 24px -8px rgba(107,70,193,.5)' },
  spoken: { background: 'var(--spoken)',  color: '#fff',           shadow: '0 10px 24px -8px rgba(31,124,142,.5)' },
  light:  { background: '#fff',           color: 'var(--ink)',     shadow: 'var(--sh-1)', border: '1px solid var(--glass-line)' },
}

export function CTA({ fi, en, icon, iconRight, variant = 'ink', flex, onClick, disabled, style }: {
  fi: React.ReactNode; en?: React.ReactNode; icon?: string; iconRight?: string
  variant?: CTAVariant; flex?: string | number; onClick?: () => void; disabled?: boolean
  style?: React.CSSProperties
}) {
  const { bilingual } = useLang()
  const th = CTA_THEMES[variant]
  const dim = th.color === 'var(--ink)' ? 'var(--ink-3)' : 'rgba(255,255,255,.6)'
  return (
    <button onClick={onClick} disabled={disabled} className="ps-press" style={{
      flex: flex ?? 'none', width: flex ? 'auto' : '100%', border: th.border ?? 'none',
      cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.55 : 1,
      background: th.background, color: th.color, boxShadow: disabled ? 'none' : th.shadow,
      borderRadius: 999, padding: '13px 22px', minHeight: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, ...style,
    }}>
      {icon && <I name={icon as never} size={21} sw={2} />}
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.05 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.5, letterSpacing: '-0.01em' }}>{fi}</span>
        {en && bilingual && (
          <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 500, fontSize: 11, color: dim }}>{en}</span>
        )}
      </span>
      {iconRight && <I name={iconRight as never} size={21} sw={2} />}
    </button>
  )
}

/* ---- Circular white nav button (exercise headers) ---- */
export function RoundBtn({ icon, onClick, size = 48 }: { icon: string; onClick?: () => void; size?: number }) {
  return (
    <button onClick={onClick} aria-label={icon} className="ps-press" style={{
      width: size, height: size, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
      background: '#fff', color: 'var(--ink)', boxShadow: 'var(--sh-1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <I name={icon as never} size={size * 0.4} sw={2} />
    </button>
  )
}

/* ---- Centered context label for exercise headers ---- */
export function CenterLabel({ fi, en, color = 'var(--written)' }: { fi: string; en?: string; color?: string }) {
  const { bilingual } = useLang()
  return (
    <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
      <span className="ps-label" style={{ color }}>{fi}</span>
      {en && bilingual && (
        <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontStyle: 'italic',
          fontSize: 10, fontWeight: 500, color: 'var(--ink-3)' }}>{en}</span>
      )}
    </div>
  )
}

/* ---- Counter like 1/7 ---- */
export function Counter({ a, b }: { a: number; b: number }) {
  return (
    <span className="ps-num" style={{ fontFamily: 'var(--font-display)', fontWeight: 700,
      fontSize: 15.8, color: 'var(--ink)', flexShrink: 0 }}>
      {a}<span style={{ color: 'var(--ink-3)' }}>/{b}</span>
    </span>
  )
}

/* ---- Exercise top bar: nav button | centered context | counter, + progress below ---- */
export function ExBar({ nav, onNav, left, center, right, children }: {
  nav?: 'close' | 'back'; onNav?: () => void
  left?: React.ReactNode; center?: React.ReactNode; right?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 48 }}>
        {nav
          ? <RoundBtn icon={nav === 'back' ? 'arrowL' : 'close'} onClick={onNav} />
          : (left ?? <span style={{ width: 48, flexShrink: 0 }} />)}
        {center}
        {right ?? <span style={{ width: 48, flexShrink: 0 }} />}
      </div>
      {children && <div style={{ marginTop: 13 }}>{children}</div>}
    </div>
  )
}

/* ---- Onboarding top bar: wordmark + Skip + segmented progress ---- */
export function OnbBar({ step = 0, total = 4, onSkip, mark }: {
  step?: number; total?: number; onSkip?: () => void; mark: React.ReactNode
}) {
  const { bilingual } = useLang()
  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {mark}
        <button onClick={onSkip} className="ps-press" style={{ background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'right', padding: 0 }}>
          <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>Ohita</span>
          {bilingual && <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11.5, color: 'var(--ink-3)' }}>Skip</span>}
        </button>
      </div>
      <div style={{ marginTop: 13 }}>
        <Steps total={total} current={step} color="var(--ink)" />
      </div>
    </div>
  )
}

/* ---- Hub header: eyebrow + big title + subtitle ---- */
export function HubHeader({ eyebrowFi, eyebrowEn, eyebrowColor = 'var(--written)', title, sub, center = false, titleSize = 33 }: {
  eyebrowFi?: string; eyebrowEn?: string; eyebrowColor?: string
  title: React.ReactNode; sub?: React.ReactNode; center?: boolean; titleSize?: number
}) {
  return (
    <div style={{ textAlign: center ? 'center' : 'left' }}>
      {(eyebrowFi || eyebrowEn) && (
        <Eyebrow fi={eyebrowFi ?? ''} en={eyebrowEn} color={eyebrowColor} center={center} style={{ marginBottom: 14 }} />
      )}
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: titleSize,
        lineHeight: 1.0, letterSpacing: '-0.03em', color: 'var(--ink)', margin: 0 }}>{title}</h1>
      {sub && (
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14.4, lineHeight: 1.45,
          color: 'var(--ink-2)', margin: '12px 0 0', textWrap: 'pretty',
          maxWidth: center ? 320 : 'none', marginLeft: center ? 'auto' : 0, marginRight: center ? 'auto' : 0 }}>{sub}</p>
      )}
    </div>
  )
}

/* ---- Rounded icon tile ---- */
export function IconTile({ icon, color = 'var(--written)', bg = 'var(--written-bg)', size = 52, r = 16 }: {
  icon: string; color?: string; bg?: string; size?: number; r?: number
}) {
  return (
    <span style={{ width: size, height: size, borderRadius: r, flexShrink: 0, background: bg, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <I name={icon as never} size={size * 0.44} sw={1.9} />
    </span>
  )
}

/* ---- List/choice row: icon | (title + en + desc) | trailing ---- */
export function ChoiceCard({ icon, iconColor, iconBg, title, en, desc, trailing, onClick, align = 'center', style }: {
  icon?: string; iconColor?: string; iconBg?: string
  title: React.ReactNode; en?: React.ReactNode; desc?: React.ReactNode
  trailing?: React.ReactNode; onClick?: () => void; align?: 'center' | 'top'
  style?: React.CSSProperties
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} className={`ps-card${onClick ? ' ps-press' : ''}`} style={{
      padding: 16, display: 'flex', alignItems: align === 'top' ? 'flex-start' : 'center', gap: 14,
      width: '100%', textAlign: 'left', cursor: onClick ? 'pointer' : 'default', ...style,
    }}>
      {icon && <IconTile icon={icon} color={iconColor} bg={iconBg} />}
      <span style={{ flex: 1, minWidth: 0, display: 'block' }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.5,
            letterSpacing: '-0.01em', color: 'var(--ink)' }}>{title}</span>
          {en && <Gloss>{en}</Gloss>}
        </span>
        {desc && (
          <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14,
            lineHeight: 1.4, color: 'var(--ink-2)', marginTop: 5, textWrap: 'pretty' }}>{desc}</span>
        )}
      </span>
      {trailing}
    </Tag>
  )
}

export function TrailArrow() {
  return <span style={{ color: 'var(--ink-3)', flexShrink: 0 }}><I name="arrow" size={22} sw={2} /></span>
}

/* ---- Tappable answer/option row (quiz, listen-choose, read) ---- */
export function OptionRow({ children, state, onClick, disabled, style }: {
  children: React.ReactNode; state?: 'correct' | 'wrong' | null
  onClick?: () => void; disabled?: boolean; style?: React.CSSProperties
}) {
  const map = {
    correct: { border: '1.5px solid var(--spoken)', background: 'var(--spoken-bg)' },
    wrong:   { border: '1.5px solid #C2603F', background: 'rgba(194,96,63,.08)' },
  } as const
  const st = state ? map[state] : {}
  return (
    <button onClick={onClick} disabled={disabled} className="ps-card ps-press" style={{
      padding: '17px 22px', borderRadius: 'var(--r-lg)', width: '100%', textAlign: 'left',
      cursor: disabled ? 'default' : 'pointer',
      fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16.3, color: 'var(--ink)', ...st, ...style,
    }}>
      {children}
    </button>
  )
}

/* ---- Real text input styled as the design's Field ---- */
const fieldBase: React.CSSProperties = {
  width: '100%', padding: '17px 18px', borderRadius: 'var(--r-lg)',
  background: '#fff', boxShadow: 'var(--sh-2)', border: '1px solid var(--glass-line)',
  fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17.2, color: 'var(--ink)',
  outline: 'none',
}

export function FieldInput({ value, onChange, placeholder, onEnter, disabled, autoFocus, type = 'text', style }: {
  value: string; onChange: (v: string) => void; placeholder?: string
  onEnter?: () => void; disabled?: boolean; autoFocus?: boolean; type?: string
  style?: React.CSSProperties
}) {
  const [focus, setFocus] = useState(false)
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      disabled={disabled} autoFocus={autoFocus}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter() } }}
      style={{ ...fieldBase, border: focus ? '1.5px solid var(--flag)' : fieldBase.border as string, ...style }}
    />
  )
}

export function FieldArea({ value, onChange, placeholder, onEnter, disabled, autoFocus, rows = 2, tone, style }: {
  value: string; onChange: (v: string) => void; placeholder?: string
  onEnter?: () => void; disabled?: boolean; autoFocus?: boolean; rows?: number
  tone?: string // override the focus/graded border color
  style?: React.CSSProperties
}) {
  const [focus, setFocus] = useState(false)
  const border = tone ? `1.5px solid ${tone}` : focus ? '1.5px solid var(--flag)' : (fieldBase.border as string)
  return (
    <textarea
      value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      disabled={disabled} autoFocus={autoFocus} rows={rows}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && onEnter) { e.preventDefault(); onEnter() } }}
      style={{ ...fieldBase, border, resize: 'none', ...style }}
    />
  )
}

/* ---- Decorative audio waveform ---- */
export function Waveform({ color = 'var(--written)', n = 26, active = 0.55, h = 40, style }: {
  color?: string; n?: number; active?: number; h?: number; style?: React.CSSProperties
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: h, ...style }}>
      {Array.from({ length: n }).map((_, i) => {
        const base = 5 + Math.abs(Math.sin(i * 0.8)) * (h - 10)
        return <span key={i} style={{ width: 3, borderRadius: 2, height: base, background: color, opacity: i / n < active ? 0.9 : 0.3 }} />
      })}
    </div>
  )
}

/* ---- Small stat tile (Progress / Sentence Bank) ---- */
export function StatTile({ n, fi, en, tone = 'var(--ink)' }: { n: React.ReactNode; fi: string; en?: string; tone?: string }) {
  const { bilingual } = useLang()
  return (
    <div className="ps-card" style={{ padding: '16px 8px', borderRadius: 'var(--r-lg)', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 21.8, letterSpacing: '-0.03em', color: tone }}>{n}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5, color: 'var(--ink-2)', marginTop: 2 }}>{fi}</div>
      {en && bilingual && <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'var(--ink-3)' }}>{en}</div>}
    </div>
  )
}

/* ---- Stacked uppercase label with EN gloss under (drill prompts) ---- */
export function StackLabel({ fi, en, color = 'var(--ink-3)', style }: {
  fi: string; en?: string; color?: string; style?: React.CSSProperties
}) {
  const { bilingual } = useLang()
  return (
    <span style={{ display: 'inline-block', ...style }}>
      <span className="ps-label" style={{ color, display: 'block' }}>{fi}</span>
      {en && bilingual && (
        <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 500, fontSize: 10.5,
          color: 'var(--ink-3)', display: 'block', marginTop: 1 }}>{en}</span>
      )}
    </span>
  )
}

export { Bar }
