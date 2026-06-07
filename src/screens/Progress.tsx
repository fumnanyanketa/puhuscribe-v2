import { useState } from 'react'
import { OrbCluster, Label } from '../components/primitives'
import { Bar, Ring, IconBtn } from '../components/ui'
import { I } from '../components/icons'
import { ScreenScroll, AppScreen } from '../components/Shell'
import { Token } from '../components/primitives'
import { useAuth } from '../lib/auth/useAuth'

interface Phrase { gloss: string; kirja: Token[]; puhe: Token[] }

const RECENT: Phrase[] = [
  { gloss: 'I am at home',
    kirja: [{ t: 'Minä', hot: true }, { t: 'olen', hot: true }, { t: 'kotona' }],
    puhe:  [{ t: 'Mä', hot: true }, { t: 'oon', hot: true }, { t: 'kotona' }] },
  { gloss: 'Do you want to come along?',
    kirja: [{ t: 'Haluatko', hot: true }, { t: 'tulla' }, { t: 'mukaan?' }],
    puhe:  [{ t: 'Haluuks', hot: true }, { t: 'sä', hot: true }, { t: 'tulla' }, { t: 'mukaan?' }] },
]

const DAYS = [['Mon', '11'], ['Tue', '11'], ['Wed', '12'], ['Thu', '13'], ['Fri', '14'], ['Sat', '15'], ['Sun', '16']] as const
const WEEK = [40, 65, 30, 80, 55, 90, 70]

export function Progress({ go: _go }: { go: (s: AppScreen) => void }) {
  const [day, setDay] = useState(4)
  const { user, signOut } = useAuth()

  return (
    <ScreenScroll bottom={110}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h1 className="ps-title-1">Kesäkuu 2026</h1>
          <span style={{ color: 'var(--ink-2)' }}><I name="chevD" size={20} /></span>
        </div>
        <IconBtn icon="plus" tone="solid" size={44} />
      </div>

      {/* Calendar day row */}
      <div className="ps-glass" style={{ marginTop: 16, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 4 }}>
        {DAYS.map(([d, n], i) => {
          const on = i === day
          return (
            <button key={i} onClick={() => setDay(i)} className="ps-press" style={{
              flex: 1, padding: '10px 0', borderRadius: 16, border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
              background: on ? 'var(--ink)' : 'transparent',
              color: on ? 'var(--on-dark)' : 'var(--ink-2)',
              transition: 'background .15s, color .15s',
            }}>
              <span className="ps-label" style={{ fontSize: 9.5, opacity: on ? 0.75 : 0.6 }}>{d}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>{n}</span>
            </button>
          )
        })}
      </div>

      {/* Mastered hero card (lavender pastel) */}
      <div style={{ marginTop: 16, padding: 20, borderRadius: 'var(--r-xl)', background: 'var(--lav)',
        border: '1px solid rgba(255,255,255,.5)', display: 'flex', alignItems: 'center', gap: 16,
        position: 'relative', overflow: 'hidden' }}>
        <OrbCluster size={116} style={{ position: 'absolute', right: -46, top: -34, opacity: 0.35 }} />
        <Ring value={847} max={1200} size={100} stroke={9} color="var(--written)" track="rgba(255,255,255,.55)">
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 25, lineHeight: 1, letterSpacing: '-0.02em' }}>847</span>
          <span className="ps-label" style={{ color: 'var(--ink-3)', marginTop: 3, fontSize: 9.5 }}>of 1200</span>
        </Ring>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <Label color="var(--lav-ink)">Phrases mastered</Label>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginTop: 8,
            lineHeight: 1.15, letterSpacing: '-0.01em', overflowWrap: 'anywhere' }}>
            Conversational foundations
          </div>
          <div className="ps-caption" style={{ marginTop: 8 }}>+34 this week</div>
        </div>
      </div>

      {/* Register balance */}
      <div className="ps-glass" style={{ marginTop: 14, padding: 18 }}>
        <Label color="var(--ink-3)">Register balance</Label>
        <div style={{ marginTop: 16, display: 'grid', gap: 16 }}>
          {([['Kirjakieli · understood', 78, 'var(--written)'], ['Puhekieli · spoken', 52, 'var(--spoken)']] as const).map(([t, v, c]) => (
            <div key={t}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="ps-label" style={{ color: c }}>{t}</span>
                <span className="ps-num" style={{ fontWeight: 700, fontSize: 14 }}>{v}%</span>
              </div>
              <Bar value={v} color={c} h={10} />
            </div>
          ))}
        </div>
        <div className="ps-caption" style={{ marginTop: 14, lineHeight: 1.45 }}>
          You read the books well. Time on Kielisaari to close the gap with the street.
        </div>
      </div>

      {/* Pastel stat tiles */}
      <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
        {([
          ['12', 'day streak', 'flame', 'var(--blush)', 'var(--blush-ink)'],
          ['3',  'islands',    'island','var(--mint)',  'var(--mint-ink)'],
          ['34', 'this week',  'sparkle','var(--lav)', 'var(--lav-ink)'],
        ] as const).map(([n, l, ic, bg, ink]) => (
          <div key={l} style={{ flex: 1, padding: '15px 12px', textAlign: 'center', borderRadius: 'var(--r-md)',
            background: bg, border: '1px solid rgba(255,255,255,.5)' }}>
            <span style={{ color: ink }}><I name={ic as any} size={20} /></span>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, marginTop: 6, lineHeight: 1, letterSpacing: '-0.03em' }}>{n}</div>
            <div className="ps-caption" style={{ marginTop: 3, fontSize: 11.5 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Weekly activity */}
      <div className="ps-glass" style={{ marginTop: 14, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Label color="var(--ink-3)">This week</Label>
          <span className="ps-caption">min / day</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, height: 86, marginTop: 14 }}>
          {WEEK.map((v, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
              <div style={{ width: '100%', maxWidth: 22, height: `${v}%`, borderRadius: 7,
                background: i === day ? 'var(--ink)' : 'rgba(107,70,193,.3)' }} />
              <span className="ps-label" style={{ color: 'var(--ink-3)', fontSize: 10 }}>{DAYS[i][0][0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recently mastered */}
      <div style={{ marginTop: 16 }}>
        <Label color="var(--ink-3)" style={{ marginLeft: 2 }}>Recently mastered</Label>
        <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
          {RECENT.map((p, i) => (
            <div key={i} className="ps-glass" style={{ padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'var(--written)', flexShrink: 0 }}><I name="check" size={18} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, lineHeight: 1.15 }}>
                  {p.kirja.map((t) => t.t).join(' ')}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13.5, color: 'var(--spoken)', marginTop: 3 }}>
                  {p.puhe.map((t) => t.t).join(' ')}
                </div>
              </div>
              <span className="ps-caption" style={{ fontStyle: 'italic', flexShrink: 0, maxWidth: 92, textAlign: 'right' }}>{p.gloss}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Account / sign out */}
      <div style={{ marginTop: 22, marginBottom: 8, textAlign: 'center' }}>
        {user?.email && (
          <div className="ps-caption" style={{ marginBottom: 8 }}>{user.email}</div>
        )}
        <button onClick={() => void signOut()} className="ps-press" style={{
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)',
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
        }}>
          Kirjaudu ulos · Sign out
        </button>
      </div>
    </ScreenScroll>
  )
}
