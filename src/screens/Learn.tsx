import { useState } from 'react'
import { Bar } from '../components/ui'
import { CTA, Eyebrow, HubHeader } from '../components/kit'
import { ScreenScroll, AppScreen, BottomNav } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'
import { useProgress } from '../lib/data/progress'
import { fetchNextWords, levelForBank, SprintWord } from '../lib/data/content'
import { fetchReviewOverview } from '../lib/data/review'
import { SprintIntro, SprintRunner } from './DayOne'

/* ---------------------------------------------------------------------------
 * Learn tab — before the first sprint is done it introduces the sprint;
 * afterwards it is the daily vocabulary bank: the next 15 most useful words
 * the learner has not met, growing the bank toward 1,000 words.
 * ------------------------------------------------------------------------- */

const BODY_BOTTOM = 96
const DAILY_N = 15
const BANK_GOAL = 1000

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

  // First sprint not done yet: the Learn tab introduces it.
  if (!sprintDone) {
    return (
      <>
        <SprintIntro embedded total={150}
          onStart={() => {
            // Mark the sprint as started so the Day One screen opens the runner.
            if (!progress.sprint) saveSprint({ size: 150, idx: 0, completed: false })
            go('dayone')
          }} />
        {nav}
      </>
    )
  }

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

  return (
    <>
      <DailyVocabHub d={d} onStart={() => d.next.length > 0 && setDeck(d.next)} />
      {nav}
    </>
  )
}

function DailyVocabHub({ d, onStart }: { d: LearnData; onStart: () => void }) {
  const { bilingual } = useLang()
  const n = d.next.length
  const preview = d.next.slice(0, 6)
  const rest = n - preview.length
  const level = levelForBank(d.bank)
  const pct = Math.min(100, Math.round((d.bank / BANK_GOAL) * 100))

  return (
    <ScreenScroll bottom={BODY_BOTTOM} style={{ paddingTop: 62 }}>
      <HubHeader eyebrowFi="PÄIVÄN SANAT" eyebrowEn="Today's words"
        title={n > 0 ? `${n} uutta sanaa` : 'Kaikki opittu!'} />

      {/* Progress toward 1000 */}
      <div className="ps-card" style={{ marginTop: 16, padding: 18, borderRadius: 'var(--r-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span className="ps-num">
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 21.6,
              letterSpacing: '-0.03em', color: 'var(--ink)' }}>{d.bank}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.5, color: 'var(--ink-3)' }}> / {BANK_GOAL}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px',
            borderRadius: 999, background: 'var(--written-bg)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--written)' }}>Taso {level}</span>
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13.5, color: 'var(--ink-2)', margin: '4px 0 14px' }}>
          sanaa opittu{' '}
          {bilingual && <span style={{ color: 'var(--ink-3)' }}>words learned · goal in about 6 weeks</span>}
        </div>
        <Bar value={pct} color="var(--written)" track="var(--glass-deep)" h={9} />
      </div>

      {/* Today's set preview */}
      {n > 0 && (
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
        </>
      )}
      {n === 0 && (
        <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 18 }}>
          Olet tavannut kaikki sanat.{' '}
          {bilingual && <span style={{ color: 'var(--ink-3)' }}>You have met every word in the bank. Reviews keep them fresh.</span>}
        </p>
      )}

      <div style={{ flex: 1, minHeight: 18 }} />
      {n > 0 && <CTA fi="Aloita" en={`Start · ${n} words`} iconRight="arrow" variant="ink" onClick={onStart} />}
    </ScreenScroll>
  )
}
