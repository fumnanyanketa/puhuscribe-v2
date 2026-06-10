import { I } from '../components/icons'
import { BrandMark } from '../components/primitives'
import { Bar, Ring } from '../components/ui'
import { Eyebrow, CTA, IconTile } from '../components/kit'
import { PuhuMark, ScreenScroll, AppScreen, BottomNav } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'
import { useProgress } from '../lib/data/progress'
import { fetchHomeData, HomeData } from '../lib/data/home'
import { SPRINT_CAP } from './DayOne'
import { journeyState, JourneyState, STAGE1_WORDS, STAGE1_SENTENCES } from '../lib/journey'
import { studyStreak, todayStudyMinutes, DAILY_GOAL_MIN } from '../lib/studyTime'

const BODY_BOTTOM = 96
const DAILY_WORDS = 15

/* Wordmark + streak chip */
function TopRow({ streak }: { streak: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <PuhuMark size={20} />
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px',
        borderRadius: 999, background: 'var(--written-bg)' }}>
        <span style={{ color: 'var(--written)' }}><I name="flame" size={17} sw={1.9} /></span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.9, color: 'var(--written)' }}>
          {Math.max(1, streak)}
        </span>
        {streak <= 1 && <span className="ps-label" style={{ color: 'var(--written)', fontSize: 9.5 }}>PÄIVÄ</span>}
      </span>
    </div>
  )
}

function Greeting({ fi, en }: { fi: string; en: string }) {
  const { bilingual } = useLang()
  return (
    <div style={{ marginTop: 16 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 23,
        letterSpacing: '-0.03em', color: 'var(--ink)', margin: 0 }}>{fi}</h1>
      {bilingual && (
        <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 500,
          fontSize: 13, color: 'var(--ink-3)', marginTop: 1 }}>{en}</div>
      )}
    </div>
  )
}

function greeting(): { fi: string; en: string } {
  const h = new Date().getHours()
  if (h < 11) return { fi: 'Hyvää huomenta', en: 'Good morning' }
  if (h < 17) return { fi: 'Hyvää päivää', en: 'Good afternoon' }
  return { fi: 'Hyvää iltaa', en: 'Good evening' }
}

export function Home({ go }: { go: (s: AppScreen) => void }) {
  const { user } = useAuth()
  const { progress } = useProgress()
  const { bi } = useLang()
  const userId = user?.id ?? ''
  const { data, loading, error } = useAsync<HomeData>(() => fetchHomeData(userId), [userId])

  const nav = <BottomNav active="home" onNav={go} />

  if (loading) return <><StatePane title={bi('Ladataan…', 'Loading')} bottom={BODY_BOTTOM + 14} />{nav}</>
  if (error) return <><StatePane tone="error" title="Couldn't load your home" detail={error} bottom={BODY_BOTTOM + 14} />{nav}</>
  const d = data!

  const sprintDone = Boolean(progress.sprint?.completed)
  const sprintStarted = Boolean(progress.sprint && (progress.sprint.idx ?? 0) > 0 && !sprintDone)
  const js = journeyState(d.bank, d.sentBank)

  return (
    <>
      <ScreenScroll bottom={BODY_BOTTOM} style={{ paddingTop: 60 }}>
        <TopRow streak={studyStreak()} />
        <Greeting {...(sprintStarted ? { fi: 'Tervetuloa takaisin!', en: 'Welcome back!' } : greeting())} />

        {/* What's next: resume/start the first sprint, or the daily plan */}
        {sprintDone
          ? <TodayPlan d={d} go={go} />
          : <SprintHero go={go} sprint={progress.sprint ?? null} />}

        {/* The dashboard: overall progress + the two banks you are growing */}
        <ProgressDash js={js} bank={d.bank} sentBank={d.sentBank} onOpen={() => go('progress')} />

        {/* Quick actions */}
        <Eyebrow fi="PIKAVALINNAT" en="Jump back in" color="var(--ink-3)" style={{ marginTop: 24, marginBottom: 14 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <QuickCard icon="book" tone="var(--written)" toneBg="var(--written-bg)"
            fi="Sanasto" en="Vocabulary" badge={`${DAILY_WORDS} uutta`} onClick={() => go('learn')} />
          <QuickCard icon="review" tone="var(--spoken)" toneBg="var(--spoken-bg)"
            fi="Kertaus" en="Review" badge={`${d.vocabDue + d.sentDue} vuorossa`} onClick={() => go('daily')} />
          <QuickCard icon="lines" tone="var(--flag)" toneBg="var(--flag-bg)"
            fi="Omat lauseet" en="Sentences" badge={`${d.sets} ${d.sets === 1 ? 'setti' : 'settiä'}`} onClick={() => go('islands')} />
          <QuickCard icon="mic" tone="#C2603F" toneBg="rgba(194,96,63,.12)"
            fi="Harjoittele" en="Practice" badge="4 taitoa" onClick={() => go('practice')} />
        </div>
      </ScreenScroll>
      {nav}
    </>
  )
}

/* =====================================================================
   Resume / start the first sprint (shown until it is completed)
   ===================================================================== */
function SprintHero({ go, sprint }: {
  go: (s: AppScreen) => void; sprint: { size: number; idx: number } | null
}) {
  const { bilingual } = useLang()
  // Only one sprint length now — show the canonical 150, never a stale `size`
  // (e.g. 50) saved by the removed set-size picker. Saved idx still resumes.
  const size = SPRINT_CAP
  const idx = Math.min(sprint?.idx ?? 0, size)
  const pct = Math.round((idx / size) * 100)
  const started = idx > 0
  const left = size - idx

  return (
    <>
      <div style={{ marginTop: 16, borderRadius: 'var(--r-xl)', overflow: 'hidden',
        background: 'linear-gradient(155deg, var(--orb-violet), var(--orb-deep))',
        boxShadow: '0 22px 44px -20px rgba(56,53,131,.6)', color: '#fff', padding: 20, position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: -26, right: -22, opacity: 0.16, pointerEvents: 'none' }}>
          <BrandMark size={104} />
        </div>
        <span className="ps-label" style={{ color: 'rgba(255,255,255,.85)' }}>
          ENSIMMÄINEN SPRINT
          {bilingual && (
            <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 500,
              fontSize: 10.5, color: 'rgba(255,255,255,.7)', marginTop: 1, letterSpacing: 0, textTransform: 'none' }}>
              Your first sprint
            </span>
          )}
        </span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19.5, lineHeight: 1.05,
          letterSpacing: '-0.02em', margin: '12px 0 0', position: 'relative' }}>
          {started ? 'Jatka siitä mihin jäit' : 'Aloita ensimmäinen sprintti'}
        </h2>
        {bilingual && (
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14,
            color: 'rgba(255,255,255,.8)', margin: '5px 0 0' }}>
            {started ? 'Continue where you left off' : 'Start your first sprint'}
          </p>
        )}
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
            {idx}<span style={{ color: 'rgba(255,255,255,.65)' }}> / {size} sanaa</span>
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>{pct}%</span>
        </div>
        <div style={{ marginTop: 10 }}>
          <Bar value={pct} color="#fff" track="rgba(255,255,255,.22)" h={9} />
        </div>
      </div>

      <CTA style={{ marginTop: 14 }} icon="sparkle" variant="ink" onClick={() => go('dayone')}
        fi={started ? 'Jatka sprinttiä' : 'Aloita sprintti'}
        en={started ? `Continue sprint · ${left} left` : 'Start the sprint'} />
    </>
  )
}

/* =====================================================================
   Today's plan card (once the first sprint is done)
   ===================================================================== */
function TodayPlan({ d, go }: { d: HomeData; go: (s: AppScreen) => void }) {
  const { bilingual } = useLang()
  const todayMin = todayStudyMinutes()

  return (
    <div className="ps-card" style={{ marginTop: 20, padding: 20, borderRadius: 'var(--r-xl)' }}>
      <Eyebrow fi="PÄIVÄN SUUNNITELMA" en="Today's plan" color="var(--written)" style={{ marginBottom: 16 }} />
      <PlanRow icon="sparkle" tone="var(--written)" toneBg="var(--written-bg)"
        fi="Uudet sanat" en="New words" n={DAILY_WORDS} unit="sanaa" />
      <hr className="ps-rule" style={{ margin: '14px 0' }} />
      <PlanRow icon="review" tone="var(--spoken)" toneBg="var(--spoken-bg)"
        fi="Kertaus" en="Reviews due" n={d.vocabDue + d.sentDue} unit="vuorossa" />
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <span className="ps-label" style={{ color: 'var(--ink-3)' }}>
            TÄNÄÄN OPISKELTU{bilingual && <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 500, fontSize: 9.5, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>studied today</span>}
          </span>
          <span className="ps-num" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: todayMin >= DAILY_GOAL_MIN ? 'var(--spoken)' : 'var(--ink-2)' }}>
            {todayMin} / {DAILY_GOAL_MIN} min
          </span>
        </div>
        <Bar value={Math.min(100, (todayMin / DAILY_GOAL_MIN) * 100)} color={todayMin >= DAILY_GOAL_MIN ? 'var(--spoken)' : 'var(--written)'} track="var(--glass-deep)" h={7} />
      </div>
      <div style={{ marginTop: 18 }}>
        <CTA fi="Aloita päivä" en="Start today · ~15 min" iconRight="arrow" variant="ink"
          style={{ minHeight: 58 }} onClick={() => go('daily')} />
      </div>
    </div>
  )
}

/* =====================================================================
   Progress dashboard — the headline % and the two banks (tap → Progress
   for the full journey map, which stays on its own page)
   ===================================================================== */
function ProgressDash({ js, bank, sentBank, onOpen }: {
  js: JourneyState; bank: number; sentBank: number; onOpen: () => void
}) {
  const { bilingual } = useLang()
  return (
    <button className="ps-card ps-press" onClick={onOpen} style={{ marginTop: 16, padding: 18,
      borderRadius: 'var(--r-xl)', width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Ring value={js.overallPct} max={100} size={72} stroke={9} color="var(--written)" track="var(--glass-deep)">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--ink)', lineHeight: 1 }}>
              {js.overallPct}<span style={{ fontSize: 10, color: 'var(--ink-3)' }}>%</span>
            </div>
            <div className="ps-label" style={{ fontSize: 8, color: 'var(--ink-3)', marginTop: 2 }}>VALMIS</div>
          </div>
        </Ring>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.5, color: 'var(--ink)' }}>
            Vaihe {js.current} · Perusta
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12.5, color: 'var(--ink-2)', marginTop: 1 }}>
            {js.overallPct}% valmis{bilingual && <span style={{ color: 'var(--ink-3)' }}> · Foundation</span>}
          </div>
        </div>
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ink-3)' }}>
          <span className="ps-label" style={{ color: 'var(--ink-3)' }}>MATKA</span>
          <I name="arrow" size={18} sw={2} />
        </span>
      </div>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <BankBar fi="Sanasto" en="Vocabulary" value={bank} goal={STAGE1_WORDS} color="var(--written)" />
        <BankBar fi="Lauseet" en="Sentences" value={sentBank} goal={STAGE1_SENTENCES} color="var(--spoken)" />
      </div>
    </button>
  )
}

function BankBar({ fi, en, value, goal, color }: {
  fi: string; en: string; value: number; goal: number; color: string
}) {
  const { bilingual } = useLang()
  const pct = Math.min(100, Math.round((value / goal) * 100))
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>
          {fi}
          {bilingual && <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 500, fontSize: 11, color: 'var(--ink-3)', marginLeft: 6 }}>{en}</span>}
        </span>
        <span className="ps-num" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--ink-3)' }}>
          {value.toLocaleString()} / {goal.toLocaleString()}
        </span>
      </div>
      <Bar value={pct} color={color} track="var(--glass-deep)" h={7} />
    </div>
  )
}

function PlanRow({ icon, tone, toneBg, fi, en, n, unit }: {
  icon: string; tone: string; toneBg: string; fi: string; en: string; n: number; unit: string
}) {
  const { bilingual } = useLang()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
      <IconTile icon={icon} color={tone} bg={toneBg} size={44} r={13} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.8, color: 'var(--ink)' }}>{fi}</div>
        {bilingual && (
          <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11.5, color: 'var(--ink-3)' }}>{en}</div>
        )}
      </div>
      <span style={{ textAlign: 'right' }}>
        <span className="ps-num" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17.2, color: tone }}>{n}</span>
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5, color: 'var(--ink-3)', display: 'block', marginTop: -2 }}>{unit}</span>
      </span>
    </div>
  )
}

function QuickCard({ icon, tone, toneBg, fi, en, badge, onClick }: {
  icon: string; tone: string; toneBg: string; fi: string; en: string; badge: string; onClick: () => void
}) {
  const { bilingual } = useLang()
  return (
    <button className="ps-card ps-press" onClick={onClick} style={{ padding: 16, borderRadius: 'var(--r-lg)',
      cursor: 'pointer', textAlign: 'left', border: 'none', width: '100%' }}>
      <IconTile icon={icon} color={tone} bg={toneBg} size={42} r={13} />
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.3, color: 'var(--ink)', marginTop: 12 }}>{fi}</div>
      {bilingual && (
        <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'var(--ink-3)' }}>{en}</div>
      )}
      <div style={{ marginTop: 10, display: 'inline-flex', padding: '4px 10px', borderRadius: 999, background: toneBg }}>
        <span className="ps-num" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11.5, color: tone }}>{badge}</span>
      </div>
    </button>
  )
}
