import React from 'react'
import { Token, RegDot, Sentence } from './primitives'
import { SpeakerBtn } from './ui'

export interface RegisterCardProps {
  kirja: Token[]
  puhe: Token[]
  gloss?: string
  badge?: string
  compact?: boolean
  glass?: boolean
  onPlay?: (reg: 'kirja' | 'puhe') => void
  playing?: 'kirja' | 'puhe' | null
  style?: React.CSSProperties
}

export function RegisterCard({ kirja, puhe, gloss, badge, compact = false, glass = false, onPlay, playing, style }: RegisterCardProps) {
  const pad = compact ? 18 : 22
  return (
    <div className={glass ? 'ps-glass' : 'ps-card'}
      style={{ padding: pad, overflow: 'hidden', position: 'relative', borderRadius: 'var(--r-xl)', ...style }}>

      {gloss && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
          <span className="ps-caption" style={{ fontStyle: 'italic', color: 'var(--ink-2)' }}>{gloss}</span>
          {badge && <span className="ps-chip ps-chip--glass" style={{ fontSize: 11, padding: '5px 11px' }}>{badge}</span>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 14 }}>
        {/* Connector rail */}
        <div style={{ width: 14, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 5 }}>
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--written)', flexShrink: 0 }} />
          <span style={{
            flex: 1, width: 2,
            background: 'repeating-linear-gradient(var(--glass-edge) 0 4px, transparent 4px 9px)',
            margin: '4px 0', minHeight: compact ? 20 : 30,
          }} />
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--spoken)', flexShrink: 0 }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Kirjakieli */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <RegDot reg="kirja" />
              <div style={{ marginTop: 9 }}>
                <Sentence tokens={kirja} font="var(--font-display)" weight={600}
                  size={compact ? 20 : 23} color="var(--ink)" />
              </div>
            </div>
            {onPlay && <SpeakerBtn reg="kirja" playing={playing === 'kirja'} onClick={() => onPlay('kirja')} />}
          </div>

          <div style={{ height: compact ? 13 : 16 }} />

          {/* Puhekieli band */}
          <div style={{
            background: 'var(--spoken-bg)', border: '1px solid var(--spoken-line)',
            borderRadius: 'var(--r-md)', padding: compact ? '12px 13px' : '14px 15px',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
          }}>
            <div>
              <RegDot reg="puhe" />
              <div style={{ marginTop: 9 }}>
                <Sentence tokens={puhe} font="var(--font-body)" weight={600}
                  size={compact ? 18 : 21} color="var(--ink)" />
              </div>
            </div>
            {/* puhekieli is shown as text only — no TTS until the spoken forms are human-verified */}
          </div>
        </div>
      </div>
    </div>
  )
}
