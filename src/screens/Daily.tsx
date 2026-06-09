import { useState, type ReactNode } from 'react'
import { OrbCluster, Label } from '../components/primitives'
import { Btn, IconBtn } from '../components/ui'
import { I } from '../components/icons'
import { ScreenScroll, AppScreen } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { RecallRunner } from '../components/RecallRunner'
import { useAsync } from '../lib/data/useAsync'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'
import { fetchVocabSession } from '../lib/data/cards'
import { fetchDueIslandRecall } from '../lib/data/islands'
import { fetchReviewOverview, ReviewOverview, ReviewItem } from '../lib/data/review'

const SESSION_SIZE = 12
const VOCAB_GOAL = 1000
const SENT_GOAL = 1000

type View = 'hub' | 'vocab' | 'sentences'

export function Daily({ go }: { go: (s: AppScreen) => void }) {
  const { user } = useAuth()
  const { bi } = useLang()
  const [view, setView] = useState<View>('hub')

  if (!user) return <StatePane title={bi('Kirjaudu sisään', 'Sign in')} detail="Sign in to start your review." bottom={110} />

  if (view === 'vocab') return <VocabTrack userId={user.id} go={go} onExit={() => setView('hub')} />
  if (view === 'sentences') return <SentenceTrack userId={user.id} go={go} onExit={() => setView('hub')} />
  return <Hub userId={user.id} go={go} onVocab={() => setView('vocab')} onSentences={() => setView('sentences')} />
}

/* -------------------------------------------------------------------------- */
/* Hub — the two daily tracks, each with its bank progress                      */
/* -------------------------------------------------------------------------- */
function Hub({ userId, go, onVocab, onSentences }: {
  userId: string; go: (s: AppScreen) => void; onVocab: () => void; onSentences: () => void
}) {
  const { bi } = useLang()
  const { data, loading, error } = useAsync<ReviewOverview>(() => fetchReviewOverview(userId), [userId])

  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={110} />
  if (error) return <StatePane tone="error" title="Couldn't load your review" detail={error} bottom={110} />
  const o = data!

  return (
    <ScreenScroll bottom={110}>
      <Label color="var(--written)">Daily Review</Label>
      <h1 className="ps-title-1" style={{ marginTop: 8 }}>Päivän kertaus</h1>
      <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 8 }}>
        Type each one from memory — that's what makes it stick. Two banks grow a little every day: your words and your own sentences.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 4px' }}>
        <OrbCluster size={104} />
      </div>

      <div style={{ display: 'grid', gap: 14, marginTop: 10 }}>
        <TrackCard
          icon="cards" accent="var(--written)" accentBg="var(--written-bg)"
          fi="Sanasto" en="Vocabulary" unitFi="sanaa" unitEn="words"
          bank={o.vocabBank} goal={VOCAB_GOAL} due={o.vocabDue}
          startFi="Aloita sanat" startEn="Learn words" onStart={() => go('dayone')} onReview={onVocab}
        />
        <TrackCard
          icon="island" accent="var(--spoken)" accentBg="var(--spoken-bg)"
          fi="Omat lauseet" en="Your sentences" unitFi="lausetta" unitEn="sentences"
          bank={o.sentBank} goal={SENT_GOAL} due={o.sentDue}
          startFi="Lisää lauseita" startEn="Add sentences" onStart={() => go('islands')} onReview={onSentences}
        />
      </div>
    </ScreenScroll>
  )
}

function TrackCard({ icon, accent, accentBg, fi, en, unitFi, unitEn, bank, goal, due, startFi, startEn, onStart, onReview }: {
  icon: string; accent: string; accentBg: string
  fi: string; en: string; unitFi: string; unitEn: string
  bank: number; goal: number; due: number
  startFi: string; startEn: string; onStart: () => void; onReview: () => void
}) {
  const { bi } = useLang()
  const pct = Math.min(100, Math.round((bank / goal) * 100))
  const empty = bank === 0

  return (
    <div className="ps-card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <span style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0, background: accentBg, color: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I name={icon} size={24} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}>{bi(fi, en)}</div>
          <div className="ps-caption ps-num" style={{ marginTop: 2 }}>{bank} / {goal} {bi(unitFi, unitEn)}</div>
        </div>
        {!empty && due > 0 && (
          <span className="ps-chip" style={{ background: accentBg, color: accent, fontSize: 11, padding: '5px 10px', flexShrink: 0 }}>
            {due} {bi('vuorossa', 'due')}
          </span>
        )}
      </div>

      {/* Bank progress toward the goal */}
      <div style={{ marginTop: 14, height: 7, borderRadius: 999, background: 'var(--glass-deep)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: accent, transition: 'width .5s' }} />
      </div>

      <div style={{ marginTop: 14 }}>
        {empty ? (
          <Btn variant="light" block iconRight="arrow" onClick={onStart}>{bi(startFi, startEn)}</Btn>
        ) : (
          <Btn variant="primary" block iconRight="arrow" onClick={onReview}>
            {due > 0 ? <>{bi('Kertaa', 'Review')} ({due})</> : bi('Kertaa', 'Review')}
          </Btn>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Track loaders — each builds a single-kind queue, then runs the recall engine */
/* -------------------------------------------------------------------------- */
function VocabTrack({ userId, go, onExit }: { userId: string; go: (s: AppScreen) => void; onExit: () => void }) {
  const { bi } = useLang()
  const { data, loading, error } = useAsync<ReviewItem[]>(
    async () => (await fetchVocabSession(userId, SESSION_SIZE)).map((card): ReviewItem => ({ kind: 'word', card })),
    [userId],
  )
  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={110} />
  if (error) return <StatePane tone="error" title="Couldn't load the session" detail={error} bottom={110} />
  if (!data || data.length === 0) {
    return <EmptyTrack
      label={bi('Sanasto', 'Vocabulary')} title={bi('Ei kerrattavaa', 'Nothing due')}
      body="Your words come back here right before you'd forget them. Learn some in Day One to fill the bank."
      ctaFi="Opi sanoja" ctaEn="Learn words" onCta={() => go('dayone')} onExit={onExit} />
  }
  return <RecallRunner key={data.map((it) => it.card.cardId).join(',')} items={data} userId={userId}
    titleFi="Sanasto" titleEn="Vocabulary" onExit={onExit} onProgress={() => go('progress')} />
}

function SentenceTrack({ userId, go, onExit }: { userId: string; go: (s: AppScreen) => void; onExit: () => void }) {
  const { bi } = useLang()
  const { data, loading, error } = useAsync<ReviewItem[]>(
    async () => (await fetchDueIslandRecall(userId, SESSION_SIZE)).map((card): ReviewItem => ({ kind: 'island', card })),
    [userId],
  )
  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={110} />
  if (error) return <StatePane tone="error" title="Couldn't load the session" detail={error} bottom={110} />
  if (!data || data.length === 0) {
    return <EmptyTrack
      label={bi('Omat lauseet', 'Your sentences')} title={bi('Ei kerrattavaa', 'Nothing due')}
      body="Add your own sentences in My Sentence Bank — they come back here to review, day by day."
      ctaFi="Lisää lauseita" ctaEn="Add sentences" onCta={() => go('islands')} onExit={onExit} />
  }
  return <RecallRunner key={data.map((it) => it.card.cardId).join(',')} items={data} userId={userId}
    titleFi="Omat lauseet" titleEn="Your sentences" onExit={onExit} onProgress={() => go('progress')} />
}

function EmptyTrack({ label, title, body, ctaFi, ctaEn, onCta, onExit }: {
  label: ReactNode; title: ReactNode; body: string
  ctaFi: string; ctaEn: string; onCta: () => void; onExit: () => void
}) {
  const { bi } = useLang()
  return (
    <ScreenScroll bottom={110}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconBtn icon="arrowL" tone="glass" size={40} onClick={onExit} />
        <Label color="var(--written)">{label}</Label>
        <span style={{ width: 40 }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', textAlign: 'center', gap: 20 }}>
        <OrbCluster size={140} />
        <div>
          <h2 className="ps-title-1">{title}</h2>
          <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10, maxWidth: 300 }}>{body}</p>
        </div>
        <Btn variant="primary" iconRight="arrow" onClick={onCta}>{bi(ctaFi, ctaEn)}</Btn>
      </div>
    </ScreenScroll>
  )
}
