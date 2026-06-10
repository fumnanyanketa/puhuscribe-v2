import { useState } from 'react'
import { Bar } from '../components/ui'
import { I } from '../components/icons'
import { CTA, Eyebrow, HubHeader, IconTile } from '../components/kit'
import { ScreenScroll, AppScreen, BottomNav } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'
import { useProgress } from '../lib/data/progress'
import { fetchNextWords, SprintWord } from '../lib/data/content'
import { fetchReviewOverview } from '../lib/data/review'
import { SprintRunner } from './DayOne'

/* ---------------------------------------------------------------------------
 * Learn tab = the VOCABULARY BANK. It always shows the bank growing toward
 * 2,000 words. A brand-new user starts it with the Day One sprint (their first
 * 150 words); after that it serves the daily 15-word intake. It also points to
 * the graded skill drills. The sprint is greeted on Home / Day One — it no
 * longer takes over this tab.
 * ------------------------------------------------------------------------- */

const BODY_BOTTOM = 96
const DAILY_N = 15
const BANK_GOAL = 2000

interface LearnData {
  bank: number
  next: SprintWord[]
}

export function Learn({ go }: { go: (s: AppScreen) => void }) {
  const { user } = useAuth()
  const { progress, saveSprint } = useProgress()
  const { bi } = useLang()
  const userId = user?.id ?? ''
  const [reload, setReload] = useState(0)
  const [deck, setDeck] = useState<SprintWord[] | null>(null)

  const sprintDone = Boolean(progress.sprint?.completed)

  const { data, loading, error } = useAsync<LearnData>(
    async () => {
      const [overview, next] = await Promise.all([
        fetchReviewOverview(userId),
        sprintDone ? fetchNextWords(userId, DAILY_N) : Promise.resolve([]),
      ])
      return { bank: overview.vocabBank, next }
    },
    [userId, sprintDone, reload],
  )

  const nav = <BottomNav active="learn" onNav={go} />

  // A daily batch is running.
  if (deck) {
    return (
      <SprintRunner
        deck={deck}
        startIdx={0}
        labelFor={() => ({ fi: 'PÄIVÄN SANAT', en: "Today's words" })}
        onAdvance={() => { /* daily batch: met words are skipped next time */ }}
        onExit={() => { setDeck(null); setReload((n) => n + 1) }}
        done={{
          labelFi: 'VALMIS', labelEn: 'Done',
          body: `You met ${deck.length} new words. The ones you missed come back in your daily review.`,
          primaryFi: 'Valmis', primaryEn: 'Done',
          onPrimary: () => { setDeck(null); setReload((n) => n + 1) },
        }}
      />
    )
  }

  if (loading) return <><StatePane title={bi('Ladataan…', 'Loading')} bottom={BODY_BOTTOM + 14} />{nav}</>
  if (error) return <><StatePane tone="error" title="Couldn't load your words" detail={error} bottom={BODY_BOTTOM + 14} />{nav}</>
  const d = data!

  const startSprint = () => {
    // Mark the sprint as started so the Day One screen opens the runner.
    if (!progress.sprint) saveSprint({ size: 150, idx: 0, completed: false })
    go('dayone')
  }

  return (
    <>
      <VocabBankHub d={d} sprintDone={sprintDone}
        onStartSprint={startSprint}
        onStartDaily={() => d.next.length > 0 && setDeck(d.next)}
        onGraded={() => go('practice')} />
      {nav}
    </>
  )
}

function VocabBankHub({ d, sprintDone, onStartSprint, onStartDaily, onGraded }: {
  d: LearnData; sprintDone: boolean
  onStartSprint: () => void; onStartDaily: () => void; onGraded: () => void
}) {
  const { bilingual } = useLang()
  const n = d.next.length
  const preview = d.next.slice(0, 6)
  const rest = n - preview.length
  const pct = Math.min(100, Math.round((d.bank / BANK_GOAL) * 100))

  return (
    <ScreenScroll bottom={BODY_BOTTOM} style={{ paddingTop: 62 }}>
      <HubHeader eyebrowFi="SANASTO" eyebrowEn="Vocabulary" title="Sanapankki"
        sub="Your growing bank of Finnish words, built toward 2,000." />

      {/* Bank progress toward 2,000 */}
      <div className="ps-card" style={{ marginTop: 16, padding: 18, borderRadius: 'var(--r-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span className="ps-num">
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 21.6,
              letterSpacing: '-0.03em', color: 'var(--ink)' }}>{d.bank}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.5, color: 'var(--ink-3)' }}> / {BANK_GOAL.toLocaleString()}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px',
            borderRadius: 999, background: 'var(--written-bg)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--written)' }}>Vaihe 1</span>
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13.5, color: 'var(--ink-2)', margin: '4px 0 14px' }}>
          sanaa pankissa{' '}
          {bilingual && <span style={{ color: 'var(--ink-3)' }}>words in your bank · toward 2,000</span>}
        </div>
        <Bar value={pct} color="var(--written)" track="var(--glass-deep)" h={9} />
      </div>

      {/* Next action: the first sprint, or today's words */}
      {!sprintDone ? (
        <button onClick={onStartSprint} className="ps-press ps-card" style={{
          marginTop: 14, width: '100%', padding: 16, cursor: 'pointer',
          textAlign: 'left', display: 'flex', alignItems: 'center', gap: 13,
          border: '1.5px solid var(--written-line)', borderRadius: 'var(--r-lg)',
        }}>
          <IconTile icon="sparkle" size={44} r={12} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="ps-label" style={{ display: 'block', color: 'var(--written)', fontSize: 10, marginBottom: 2 }}>
              {bilingual ? 'Aloita tästä · Start here' : 'Aloita tästä'}
            </span>
            <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>
              Aloita ensimmäinen sprintti
            </span>
            <span className="ps-caption">
              {bilingual ? 'Your first 150 words, in waves' : 'Ensimmäiset 150 sanaa, aalloittain'}
            </span>
          </span>
          <span style={{ color: 'var(--written)', flexShrink: 0 }}><I name="arrow" size={20} sw={2} /></span>
        </button>
      ) : n > 0 ? (
        <>
          <Eyebrow fi="TÄNÄÄN VUOROSSA" en="Today's set" color="var(--ink-3)" style={{ marginTop: 18, marginBottom: 12 }} />
          <div className="ps-card" style={{ padding: 18, borderRadius: 'var(--r-lg)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {preview.map((w) => (
                <span key={w.id} style={{ padding: '9px 15px', borderRadius: 999, background: 'var(--written-bg)',
                  fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14.4, color: 'var(--ink)' }}>
                  {w.fi}
                </span>
              ))}
              {rest > 0 && (
                <span style={{ padding: '9px 15px', borderRadius: 999,
                  fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--ink-3)' }}>
                  +{rest} lisää
                </span>
              )}
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <CTA fi="Aloita" en={`Start · ${n} words`} iconRight="arrow" variant="ink" onClick={onStartDaily} />
          </div>
        </>
      ) : (
        <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 18 }}>
          Olet tavannut kaikki sanat tältä erää.{' '}
          {bilingual && <span style={{ color: 'var(--ink-3)' }}>You have met every word for now. Reviews keep them fresh.</span>}
        </p>
      )}

      {/* Graded skill drills (the "tests" — listening, reading, writing, level-matched) */}
      <Eyebrow fi="TASOHARJOITTELU" en="Graded practice" color="var(--ink-3)" style={{ marginTop: 24, marginBottom: 12 }} />
      <button onClick={onGraded} className="ps-press ps-card" style={{
        width: '100%', padding: 16, cursor: 'pointer', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: 13, borderRadius: 'var(--r-lg)', border: 'none',
      }}>
        <IconTile icon="check" size={44} r={12} color="var(--spoken)" bg="var(--spoken-bg)" />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.5, color: 'var(--ink)' }}>
            Testaa taitosi
          </span>
          <span className="ps-caption">
            {bilingual ? 'Graded listening, reading and writing, matched to your level' : 'Kuuntelu, lukeminen ja kirjoittaminen tasosi mukaan'}
          </span>
        </span>
        <span style={{ color: 'var(--ink-3)', flexShrink: 0 }}><I name="arrow" size={20} sw={2} /></span>
      </button>
    </ScreenScroll>
  )
}
