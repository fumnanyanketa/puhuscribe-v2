import { useState } from 'react'
import { OrbCluster, Label } from '../components/primitives'
import { Bar, Ring, Toggle, Btn } from '../components/ui'
import { I } from '../components/icons'
import { ScreenScroll, AppScreen } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'
import { useProgress } from '../lib/data/progress'
import { resetUserLearning } from '../lib/data/cards'
import { fetchProgressStats, ProgressStats } from '../lib/data/stats'

export function Progress({ go }: { go: (s: AppScreen) => void }) {
  const { user, signOut } = useAuth()
  const { bi, bilingual, setBilingual } = useLang()
  const { resetProgress } = useProgress()
  const [confirming, setConfirming] = useState(false)
  const [resetBusy, setResetBusy] = useState(false)
  const [resetErr, setResetErr] = useState('')

  const doReset = async () => {
    if (!user || resetBusy) return
    setResetBusy(true); setResetErr('')
    try {
      await resetUserLearning(user.id) // delete the user's cards
      resetProgress()                  // clear onboarding + sprint position
      go('dayone')                     // fresh start at the Day One set picker
    } catch (e) {
      setResetErr(e instanceof Error ? e.message : String(e))
      setResetBusy(false)
    }
  }
  const { data: stats, loading, error } = useAsync<ProgressStats>(
    () => (user ? fetchProgressStats(user.id) : Promise.reject(new Error('not signed in'))),
    [user?.id],
  )

  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={110} />
  if (error) return <StatePane tone="error" title="Couldn't load progress" detail={error} bottom={110} />
  if (!stats) return <StatePane title={bi('Ei dataa vielä', 'No data yet')} bottom={110} />

  const maxWeek = Math.max(1, ...stats.week.map((d) => d.count))
  const reviewed = stats.mastered + stats.learning

  return (
    <ScreenScroll bottom={110}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <Label color="var(--written)">Progress</Label>
          <h1 className="ps-title-1" style={{ marginTop: 8 }}>Edistyminen</h1>
        </div>
      </div>

      {/* Mastered hero card (lavender pastel) */}
      <div style={{ marginTop: 16, padding: 20, borderRadius: 'var(--r-xl)', background: 'var(--lav)',
        border: '1px solid rgba(255,255,255,.5)', display: 'flex', alignItems: 'center', gap: 16,
        position: 'relative', overflow: 'hidden' }}>
        <OrbCluster size={116} style={{ position: 'absolute', right: -46, top: -34, opacity: 0.35 }} />
        <Ring value={stats.mastered} max={Math.max(1, stats.totalCards)} size={100} stroke={9}
          color="var(--written)" track="rgba(255,255,255,.55)">
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 25, lineHeight: 1, letterSpacing: '-0.02em' }}>{stats.mastered}</span>
          <span className="ps-label" style={{ color: 'var(--ink-3)', marginTop: 3, fontSize: 9.5 }}>of {stats.totalCards}</span>
        </Ring>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <Label color="var(--lav-ink)">Phrases in review</Label>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginTop: 8,
            lineHeight: 1.15, letterSpacing: '-0.01em', overflowWrap: 'anywhere' }}>
            {stats.mastered > 0 ? 'Building long-term memory' : 'Start your first session'}
          </div>
          <div className="ps-caption" style={{ marginTop: 8 }}>
            {stats.newRemaining} new · {stats.learning} learning
          </div>
        </div>
      </div>

      {/* Pastel stat tiles — all real */}
      <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
        {([
          [String(stats.streakDays), 'day streak', 'flame',   'var(--blush)', 'var(--blush-ink)'],
          [String(stats.reviewsThisWeek), 'this week', 'sparkle', 'var(--lav)',  'var(--lav-ink)'],
          [String(reviewed), 'reviewed', 'check', 'var(--mint)', 'var(--mint-ink)'],
        ] as const).map(([n, l, ic, bg, ink]) => (
          <div key={l} style={{ flex: 1, padding: '15px 12px', textAlign: 'center', borderRadius: 'var(--r-md)',
            background: bg, border: '1px solid rgba(255,255,255,.5)' }}>
            <span style={{ color: ink }}><I name={ic as any} size={20} /></span>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, marginTop: 6, lineHeight: 1, letterSpacing: '-0.03em' }}>{n}</div>
            <div className="ps-caption" style={{ marginTop: 3, fontSize: 11.5 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Weekly activity (real reviews/day, last 7 days) */}
      <div className="ps-glass" style={{ marginTop: 14, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Label color="var(--ink-3)">Last 7 days</Label>
          <span className="ps-caption">reviews / day</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, height: 86, marginTop: 14 }}>
          {stats.week.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
              <div style={{ width: '100%', maxWidth: 22, height: `${(d.count / maxWeek) * 100}%`, minHeight: d.count > 0 ? 6 : 2, borderRadius: 7,
                background: i === stats.week.length - 1 ? 'var(--ink)' : 'rgba(107,70,193,.3)' }} />
              <span className="ps-label" style={{ color: 'var(--ink-3)', fontSize: 10 }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Register understanding (real: how much of the deck has graduated) */}
      <div className="ps-glass" style={{ marginTop: 14, padding: 18 }}>
        <Label color="var(--ink-3)">Deck progress</Label>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="ps-label" style={{ color: 'var(--written)' }}>In review · graduated</span>
            <span className="ps-num" style={{ fontWeight: 700, fontSize: 14 }}>
              {stats.totalCards > 0 ? Math.round((stats.mastered / stats.totalCards) * 100) : 0}%
            </span>
          </div>
          <Bar value={stats.totalCards > 0 ? (stats.mastered / stats.totalCards) * 100 : 0} color="var(--written)" h={10} />
        </div>
      </div>

      {/* Recently reviewed */}
      {stats.recent.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Label color="var(--ink-3)" style={{ marginLeft: 2 }}>Recently reviewed</Label>
          <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
            {stats.recent.map((p, i) => (
              <div key={i} className="ps-glass" style={{ padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: 'var(--written)', flexShrink: 0 }}><I name="check" size={18} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, lineHeight: 1.15 }}>
                    {p.fi}
                  </div>
                </div>
                <span className="ps-caption" style={{ fontStyle: 'italic', flexShrink: 0, maxWidth: 120, textAlign: 'right' }}>{p.en}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings — language. Labels here stay bilingual in both modes so a
          beginner who switched to Finnish-only can always find their way back. */}
      <div className="ps-glass" style={{ marginTop: 16, padding: '15px 18px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>Näytä englanti · Show English</div>
          <div className="ps-caption" style={{ marginTop: 3 }}>
            {bilingual ? 'Kaksikielinen · bilingual labels' : 'Vain suomi · Finnish only'}
          </div>
        </div>
        <Toggle on={bilingual} onChange={setBilingual} label="Show English" />
      </div>

      {/* Reset progress — start the journey over (also the tester's clean slate). */}
      <div style={{ marginTop: 20 }}>
        {!confirming ? (
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => setConfirming(true)} className="ps-press" style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, textDecoration: 'underline',
            }}>
              {bi('Aloita alusta', 'Reset progress')}
            </button>
          </div>
        ) : (
          <div className="ps-glass" style={{ padding: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14.5 }}>{bi('Aloita alusta?', 'Reset progress?')}</div>
            <p className="ps-caption" style={{ marginTop: 6 }}>
              This deletes the words you have learned and your sprint position, and starts the journey over. It cannot be undone.
            </p>
            {resetErr && (
              <div className="ps-body" style={{ marginTop: 10, padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--flag-bg)', color: 'var(--flag)' }}>
                {resetErr}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <Btn variant="light" sm style={{ flex: 1 }} onClick={() => { setConfirming(false); setResetErr('') }}>{bi('Peruuta', 'Cancel')}</Btn>
              <Btn variant="primary" sm style={{ flex: 1, background: '#C25B3F' }} disabled={resetBusy} onClick={() => void doReset()}>
                {resetBusy ? 'One moment…' : bi('Kyllä, nollaa', 'Yes, reset')}
              </Btn>
            </div>
          </div>
        )}
      </div>

      {/* Account / sign out */}
      <div style={{ marginTop: 18, marginBottom: 8, textAlign: 'center' }}>
        {user?.email && <div className="ps-caption" style={{ marginBottom: 8 }}>{user.email}</div>}
        <button onClick={() => void signOut()} className="ps-press" style={{
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)',
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
        }}>
          {bi('Kirjaudu ulos', 'Sign out')}
        </button>
      </div>
    </ScreenScroll>
  )
}
