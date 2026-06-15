import { useState } from 'react'
import { Bar, Ring, Toggle, Btn } from '../components/ui'
import { I } from '../components/icons'
import { Eyebrow, HubHeader, StatTile } from '../components/kit'
import { Journey } from '../components/Journey'
import { MilestoneLadder } from '../components/Milestones'
import { ScreenScroll, AppScreen, BottomNav } from '../components/Shell'
import { SaveProgressSheet } from '../components/SaveProgress'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'
import { useProgress } from '../lib/data/progress'
import { resetUserLearning } from '../lib/data/cards'
import { isOwner } from '../lib/data/insights'
import { fetchProgressStats, ProgressStats } from '../lib/data/stats'
import { fetchReviewOverview } from '../lib/data/review'
import { journeyState, STAGE1_WORDS, STAGE1_SENTENCES } from '../lib/journey'
import { getPracticeCounts, PRACTICE_GOAL } from '../lib/practiceStats'
import { studyStreak } from '../lib/studyTime'
import { YKI, YkiSkill } from '../lib/yki'

const BODY_BOTTOM = 96

type Loaded = { stats: ProgressStats; sentBank: number }

export function Progress({ go }: { go: (s: AppScreen) => void }) {
  const { user, isAnonymous, signOut } = useAuth()
  const { bi, bilingual, setBilingual } = useLang()
  const { progress, resetProgress } = useProgress()
  const [saveOpen, setSaveOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [resetBusy, setResetBusy] = useState(false)
  const [resetErr, setResetErr] = useState('')

  const { data, loading, error } = useAsync<Loaded>(
    async () => {
      if (!user) throw new Error('not signed in')
      const [stats, overview] = await Promise.all([fetchProgressStats(user.id), fetchReviewOverview(user.id)])
      return { stats, sentBank: overview.sentBank }
    },
    [user?.id],
  )

  const doReset = async () => {
    if (!user || resetBusy) return
    setResetBusy(true); setResetErr('')
    try {
      await resetUserLearning(user.id) // delete the user's cards
      resetProgress()                  // clear onboarding + sprint position
      go('dayone')                     // fresh start at the sprint
    } catch (e) {
      setResetErr(e instanceof Error ? e.message : String(e))
      setResetBusy(false)
    }
  }

  const nav = <BottomNav active="progress" onNav={go} />

  if (loading) return <><StatePane title={bi('Ladataan…', 'Loading')} bottom={BODY_BOTTOM + 14} />{nav}</>
  if (error) return <><StatePane tone="error" title="Couldn't load progress" detail={error} bottom={BODY_BOTTOM + 14} />{nav}</>
  const { stats, sentBank } = data!

  const js = journeyState(stats.totalCards, sentBank)
  // The journey's inline "do this next" on the current stage.
  const sDone = Boolean(progress.sprint?.completed)
  const sStarted = Boolean(progress.sprint && (progress.sprint.idx ?? 0) > 0 && !sDone)
  const journeyAction = sDone
    ? { fi: 'Päivän kertaus', en: 'Daily review', onClick: () => go('daily') }
    : sStarted
      ? { fi: 'Jatka sprinttiä', en: 'Continue your sprint', onClick: () => go('dayone') }
      : { fi: 'Aloita sprintti', en: 'Start your first sprint', onClick: () => go('dayone') }
  const streak = studyStreak()
  const counts = getPracticeCounts()
  const maxWeek = Math.max(1, ...stats.week.map((d) => d.count))
  const skills: YkiSkill[] = ['read', 'listen', 'speak', 'write']

  return (
    <>
    <ScreenScroll bottom={BODY_BOTTOM} style={{ paddingTop: 62 }}>
      {/* Header + streak chip */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <HubHeader eyebrowFi="PROGRESS" title="Edistyminen" />
        <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px',
          borderRadius: 999, background: 'var(--written-bg)', marginTop: 18 }}>
          <span style={{ color: 'var(--written)' }}><I name="flame" size={18} sw={1.8} /></span>
          <span className="ps-num" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.8, color: 'var(--written)' }}>
            {streak}
          </span>
        </span>
      </div>

      {/* Where you are now: the current stage, not a misleading CEFR badge */}
      <div className="ps-card" style={{ marginTop: 20, padding: 22, borderRadius: 'var(--r-xl)',
        display: 'flex', alignItems: 'center', gap: 20 }}>
        <Ring value={js.overallPct} max={100} size={106} stroke={10} color="var(--written)" track="var(--glass-deep)">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26,
              letterSpacing: '-0.03em', color: 'var(--ink)', lineHeight: 1 }}>
              {js.overallPct}<span style={{ fontSize: 14, color: 'var(--ink-3)' }}>%</span>
            </div>
            <div className="ps-label" style={{ color: 'var(--ink-3)', marginTop: 3, fontSize: 9 }}>VALMIS</div>
          </div>
        </Ring>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="ps-label" style={{ color: 'var(--written)' }}>VAIHE {js.current} / {4}</span>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--ink)', marginTop: 4 }}>Perusta</div>
          {bilingual && <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-3)' }}>Foundation</div>}
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13.5, lineHeight: 1.4,
            color: 'var(--ink-2)', margin: '8px 0 0' }}>
            Rakennat pohjaa: {STAGE1_WORDS.toLocaleString()} sanaa ja {STAGE1_SENTENCES.toLocaleString()} lausetta.
            {bilingual && <span style={{ color: 'var(--ink-3)' }}> Building your base.</span>}
          </p>
        </div>
      </div>

      {/* The whole journey: Launchpad to North Star (YKI B2) */}
      <div className="ps-glass" style={{ marginTop: 16, padding: 18, borderRadius: 'var(--r-xl)' }}>
        <Eyebrow fi="MATKASI" en="Your journey" color="var(--ink-3)" style={{ marginBottom: 16 }} />
        <Journey words={stats.totalCards} sentences={sentBank} action={journeyAction} />
      </div>

      {/* The milestone ladder — the granular climb beneath the stages */}
      <div className="ps-card" style={{ marginTop: 16, padding: 18, borderRadius: 'var(--r-xl)' }}>
        <Eyebrow fi="MERKKIPAALUT" en="Milestones" color="var(--ink-3)" style={{ marginBottom: 8 }} />
        <MilestoneLadder words={stats.totalCards} />
      </div>

      {/* Stat tiles — all real */}
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        <StatTile n={stats.totalCards} fi="sanaa" en="words" tone="var(--written)" />
        <StatTile n={sentBank} fi="lausetta" en="sentences" tone="var(--spoken)" />
        <StatTile n={streak} fi="päivää" en="day streak" tone="var(--flag)" />
      </div>

      {/* Skills breakdown (practice sessions toward the goal) */}
      <Eyebrow fi="TAIDOT" en="Skills" color="var(--ink-3)" style={{ marginTop: 24, marginBottom: 14 }} />
      <div className="ps-card" style={{ padding: 18, borderRadius: 'var(--r-xl)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {skills.map((sk) => {
          const c = YKI[sk]
          const pct = Math.min(100, Math.round((counts[sk] / PRACTICE_GOAL) * 100))
          return (
            <div key={sk}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{c.fi}</span>
                <span className="ps-num" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: c.color }}>{pct}%</span>
              </div>
              <Bar value={pct} color={c.color} track="var(--glass-deep)" h={8} />
            </div>
          )
        })}
      </div>

      {/* Weekly activity — real reviews/day */}
      <Eyebrow fi="TÄMÄ VIIKKO" en="This week" color="var(--ink-3)" style={{ marginTop: 24, marginBottom: 14 }} />
      <div className="ps-card" style={{ padding: 18, borderRadius: 'var(--r-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 90, gap: 8 }}>
          {stats.week.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: '100%', height: 70, display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ width: '100%', height: `${(d.count / maxWeek) * 100}%`, minHeight: d.count > 0 ? 6 : 2,
                  borderRadius: 7, background: i === stats.week.length - 1 ? 'var(--written)' : 'var(--written-bg)' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11.5, color: 'var(--ink-3)' }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Settings — language. Stays bilingual in both modes so a beginner who
          switched to Finnish-only can always find their way back. */}
      <div className="ps-card" style={{ marginTop: 24, padding: '15px 18px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', gap: 14, borderRadius: 'var(--r-lg)' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>Näytä englanti · Show English</div>
          <div className="ps-caption" style={{ marginTop: 3 }}>
            {bilingual ? 'Kaksikielinen · bilingual labels' : 'Vain suomi · Finnish only'}
          </div>
        </div>
        <Toggle on={bilingual} onChange={setBilingual} label="Show English" />
      </div>

      {/* Reset progress */}
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
          <div className="ps-card" style={{ padding: 16, borderRadius: 'var(--r-lg)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14.5 }}>{bi('Aloita alusta?', 'Reset progress?')}</div>
            <p className="ps-caption" style={{ marginTop: 6 }}>
              This deletes the words you have learned and your sprint position, and starts the journey over. It cannot be undone.
            </p>
            {resetErr && (
              <div className="ps-body" style={{ marginTop: 10, padding: '10px 14px', borderRadius: 'var(--r-md)',
                background: 'var(--flag-bg)', color: 'var(--flag)' }}>
                {resetErr}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <Btn variant="light" sm style={{ flex: 1 }} onClick={() => { setConfirming(false); setResetErr('') }}>{bi('Peruuta', 'Cancel')}</Btn>
              <Btn variant="primary" sm style={{ flex: 1, background: '#C2603F' }} disabled={resetBusy} onClick={() => void doReset()}>
                {resetBusy ? 'Hetki…' : bi('Kyllä, nollaa', 'Yes, reset')}
              </Btn>
            </div>
          </div>
        )}
      </div>

      {/* Owner-only: the beta cohort dashboard. The DB function is the real gate;
          this just hides the button from testers. */}
      {isOwner(user?.email) && (
        <button className="ps-card ps-press" onClick={() => go('insights')} style={{ marginTop: 16,
          padding: '15px 18px', borderRadius: 'var(--r-lg)', width: '100%', textAlign: 'left',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'var(--written)' }}><I name="chart" size={20} sw={1.9} /></span>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
              Owner insights
            </span>
            <span className="ps-caption">Testers, activity, latest feedback</span>
          </span>
          <span style={{ color: 'var(--ink-3)' }}><I name="arrow" size={18} sw={2} /></span>
        </button>
      )}

      {/* Account: a guest sees "save your progress" (signing out would orphan
          their account); a real account sees their email + sign out. */}
      {isAnonymous ? (
        <button className="ps-card ps-press" onClick={() => setSaveOpen(true)} style={{ marginTop: 18,
          padding: '15px 18px', borderRadius: 'var(--r-lg)', width: '100%', textAlign: 'left',
          border: '1.5px solid var(--written-line)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'var(--written)' }}><I name="star" size={20} sw={1.9} /></span>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
              {bi('Tallenna edistymisesi', 'Save your progress')}
            </span>
            <span className="ps-caption">Learning as a guest. Add an email to keep it on any device.</span>
          </span>
          <span style={{ color: 'var(--ink-3)' }}><I name="arrow" size={18} sw={2} /></span>
        </button>
      ) : (
        <div style={{ marginTop: 18, marginBottom: 8, textAlign: 'center' }}>
          {user?.email && <div className="ps-caption" style={{ marginBottom: 8 }}>{user.email}</div>}
          <button onClick={() => void signOut()} className="ps-press" style={{
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)',
            fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
          }}>
            {bi('Kirjaudu ulos', 'Sign out')}
          </button>
        </div>
      )}
    </ScreenScroll>
    {nav}
    <SaveProgressSheet open={saveOpen} onClose={() => setSaveOpen(false)} />
    </>
  )
}
