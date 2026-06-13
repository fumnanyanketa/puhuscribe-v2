import { Bar } from '../components/ui'
import { ExBar, CenterLabel, Eyebrow, StatTile } from '../components/kit'
import { ScreenScroll, AppScreen } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { fetchOwnerInsights, OwnerInsights, ago } from '../lib/data/insights'

/* ---------------------------------------------------------------------------
 * Owner insights — beta cohort at a glance: who signed up, who is actually
 * coming back, how much they study, and the latest feedback. Owner-only
 * (UI gated by email; the database function is the real gate). English-only
 * on purpose: this is the owner's screen, not a learner screen.
 * ------------------------------------------------------------------------- */

const MOOD: Record<number, string> = { 1: '😕', 2: '🙂', 3: '😍' }

export function Insights({ go }: { go: (s: AppScreen) => void }) {
  const { data, loading, error } = useAsync<OwnerInsights>(() => fetchOwnerInsights(), [])

  if (loading) return <StatePane title="Loading insights…" bottom={26} />
  if (error) return <StatePane tone="error" title="Couldn't load insights" detail={error} bottom={26} />
  const d = data!

  return (
    <ScreenScroll bottom={26}>
      <ExBar nav="back" onNav={() => go('progress')} center={<CenterLabel fi="INSIGHTS" en="Owner only" />} />

      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26,
        letterSpacing: '-0.03em', color: 'var(--ink)', margin: '18px 0 0' }}>Your testers</h1>
      <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 6 }}>
        Who is coming back, how much they study, and what they are telling you.
      </p>

      {/* Cohort tiles */}
      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <StatTile n={d.totals.testers} fi="testers" en="signed up" tone="var(--written)" />
        <StatTile n={d.totals.active7} fi="active" en="last 7 days" tone="var(--spoken)" />
        <StatTile n={d.totals.reviews7} fi="reviews" en="last 7 days" tone="var(--flag)" />
        <StatTile n={d.totals.feedback} fi="feedback" en="notes total" tone="#C2603F" />
      </div>

      {/* First languages — demand evidence for which UI languages to add next */}
      {(d.languages ?? []).length > 0 && (
        <>
          <Eyebrow fi="FIRST LANGUAGES" en="what testers speak" color="var(--ink-3)" style={{ marginTop: 24, marginBottom: 12 }} />
          <div className="ps-card" style={{ padding: '14px 16px', borderRadius: 'var(--r-lg)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(d.languages ?? []).map((l) => {
              const top = Math.max(1, ...(d.languages ?? []).map((x) => x.n))
              return (
                <div key={l.language} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 78, flexShrink: 0, fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: 13, color: l.language === 'Not set' ? 'var(--ink-3)' : 'var(--ink)' }}>{l.language}</span>
                  <span style={{ flex: 1 }}>
                    <Bar value={(l.n / top) * 100} color="var(--written)" track="var(--glass-deep)" h={8} />
                  </span>
                  <span className="ps-num" style={{ width: 28, textAlign: 'right', fontFamily: 'var(--font-body)',
                    fontWeight: 600, fontSize: 12.5, color: 'var(--ink-3)' }}>{l.n}</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Tester list */}
      <Eyebrow fi="TESTERS" en="most recent first" color="var(--ink-3)" style={{ marginTop: 24, marginBottom: 12 }} />
      {d.testers.length === 0 && (
        <p className="ps-body" style={{ color: 'var(--ink-2)' }}>No testers yet.</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {d.testers.map((t) => (
          <div key={t.email + t.joined} className="ps-card" style={{ padding: '14px 16px', borderRadius: 'var(--r-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
                color: t.email ? 'var(--ink)' : 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.email || '(guest)'}
              </span>
              <span className="ps-num" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12,
                color: t.lastActive ? 'var(--spoken)' : 'var(--ink-3)', flexShrink: 0 }}>
                {ago(t.lastActive)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
              <MiniStat n={t.words} label="words" />
              <MiniStat n={t.sentences} label="sentences" />
              <MiniStat n={t.reviews7} label="reviews 7d" />
            </div>
          </div>
        ))}
      </div>

      {/* Latest feedback */}
      <Eyebrow fi="FEEDBACK" en="latest 30" color="var(--ink-3)" style={{ marginTop: 24, marginBottom: 12 }} />
      {d.feedback.length === 0 && (
        <p className="ps-body" style={{ color: 'var(--ink-2)' }}>No feedback yet.</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {d.feedback.map((f, i) => (
          <div key={f.at + i} className="ps-card" style={{ padding: '14px 16px', borderRadius: 'var(--r-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 20, lineHeight: 1.2, flexShrink: 0 }}>{f.rating ? MOOD[f.rating] : '💬'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14,
                  lineHeight: 1.45, color: 'var(--ink)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {f.message}
                </div>
                <div className="ps-caption" style={{ marginTop: 6 }}>
                  {[f.email || 'guest', f.screen, ago(f.at) + ' ago'].filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScreenScroll>
  )
}

function MiniStat({ n, label }: { n: number; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5 }}>
      <span className="ps-num" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{n}</span>
      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 11.5, color: 'var(--ink-3)' }}>{label}</span>
    </span>
  )
}
