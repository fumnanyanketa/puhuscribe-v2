import { useState, type ReactNode } from 'react'
import { BrandMark } from '../components/primitives'
import { Bar } from '../components/ui'
import { CTA, ExBar, CenterLabel, HubHeader, IconTile } from '../components/kit'
import { ScreenScroll, AppScreen, BottomNav } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { RecallRunner } from '../components/RecallRunner'
import { useAsync } from '../lib/data/useAsync'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'
import { fetchVocabSession } from '../lib/data/cards'
import { fetchDueIslandRecall } from '../lib/data/islands'
import { fetchReviewOverview, ReviewOverview, ReviewItem } from '../lib/data/review'

const SESSION_SIZE = 12
const VOCAB_GOAL = 2000
const SENT_GOAL = 1000
const BODY_BOTTOM = 96

type View = 'hub' | 'vocab' | 'sentences'

export function Daily({ go }: { go: (s: AppScreen) => void }) {
  const { user } = useAuth()
  const { bi } = useLang()
  const [view, setView] = useState<View>('hub')

  if (!user) return <StatePane title={bi('Kirjaudu sisään', 'Sign in')} detail="Sign in to start your review." bottom={BODY_BOTTOM + 14} />

  if (view === 'vocab') return <VocabTrack userId={user.id} go={go} onExit={() => setView('hub')} />
  if (view === 'sentences') return <SentenceTrack userId={user.id} go={go} onExit={() => setView('hub')} />
  return (
    <>
      <Hub userId={user.id} go={go} onVocab={() => setView('vocab')} onSentences={() => setView('sentences')} />
      <BottomNav active="home" onNav={go} />
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Hub — the two daily tracks, each with its bank progress                      */
/* -------------------------------------------------------------------------- */
function Hub({ userId, go, onVocab, onSentences }: {
  userId: string; go: (s: AppScreen) => void; onVocab: () => void; onSentences: () => void
}) {
  const { bi } = useLang()
  const { data, loading, error } = useAsync<ReviewOverview>(() => fetchReviewOverview(userId), [userId])

  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={BODY_BOTTOM + 14} />
  if (error) return <StatePane tone="error" title="Couldn't load your review" detail={error} bottom={BODY_BOTTOM + 14} />
  const o = data!

  return (
    <ScreenScroll bottom={BODY_BOTTOM} style={{ paddingTop: 62 }}>
      <HubHeader eyebrowFi="DAILY REVIEW" title="Päivän kertaus"
        sub="Type each one from memory. That's what makes it stick." />

      <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0 4px' }}>
        <BrandMark size={110} />
      </div>

      <ReviewCard
        icon="review" tone="var(--written)" toneBg="var(--written-bg)"
        title="Sanasto" en="Vocabulary"
        bank={o.vocabBank} goal={VOCAB_GOAL} unitFi="sanaa" unitEn="words" due={o.vocabDue}
        empty={o.vocabBank === 0}
        emptyFi="Opi sanoja" emptyEn="Learn words" onEmpty={() => go('learn')}
        onReview={onVocab}
      />
      <div style={{ height: 16 }} />
      <ReviewCard
        icon="sprout" tone="var(--spoken)" toneBg="var(--spoken-bg)"
        title="Omat lauseet" en="Your sentences"
        bank={o.sentDone} goal={SENT_GOAL} unitFi="lausetta" unitEn="sentences" due={o.sentDue}
        empty={o.sentBank === 0}
        emptyFi="Lisää lauseita" emptyEn="Add sentences" onEmpty={() => go('islands')}
        onReview={onSentences}
      />
    </ScreenScroll>
  )
}

function ReviewCard({ icon, tone, toneBg, title, en, bank, goal, unitFi, unitEn, due, empty, emptyFi, emptyEn, onEmpty, onReview }: {
  icon: string; tone: string; toneBg: string
  title: string; en: string
  bank: number; goal: number; unitFi: string; unitEn: string; due: number
  empty: boolean; emptyFi: string; emptyEn: string; onEmpty: () => void
  onReview: () => void
}) {
  const { bilingual } = useLang()
  const pct = Math.min(100, (bank / goal) * 100)

  return (
    <div className="ps-card" style={{ padding: 18, borderRadius: 'var(--r-xl)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <IconTile icon={icon} color={tone} bg={toneBg} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17.2, color: 'var(--ink)' }}>{title}</span>
            {bilingual && <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-3)' }}>{en}</span>}
          </div>
          <div className="ps-num" style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14.5, color: 'var(--ink-2)', marginTop: 4 }}>
            {bank} / {goal} {unitFi}
            {bilingual && <span style={{ fontSize: 12.5, color: 'var(--ink-3)', display: 'block' }}>{unitEn}</span>}
          </div>
        </div>
        {!empty && due > 0 && (
          <span style={{ flexShrink: 0, background: toneBg, borderRadius: 14, padding: '9px 12px', textAlign: 'center' }}>
            <span className="ps-num" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.8, color: tone, display: 'block' }}>{due}</span>
            <span className="ps-label" style={{ color: tone, fontSize: 9.5 }}>vuorossa</span>
            {bilingual && <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 10.5, color: 'var(--ink-3)' }}>due</span>}
          </span>
        )}
      </div>

      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <Bar value={pct} color={tone} track="var(--glass-deep)" h={8} />
      </div>

      {empty ? (
        <CTA fi={emptyFi} en={emptyEn} iconRight="arrow" variant="light" style={{ minHeight: 58 }} onClick={onEmpty} />
      ) : (
        <CTA fi="Kertaa" en={due > 0 ? `Review · ${due} due` : 'Review'} iconRight="arrow" variant="ink"
          style={{ minHeight: 58 }} onClick={onReview} />
      )}
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
  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={BODY_BOTTOM + 14} />
  if (error) return <StatePane tone="error" title="Couldn't load the session" detail={error} bottom={BODY_BOTTOM + 14} />
  if (!data || data.length === 0) {
    return <EmptyTrack
      labelFi="SANASTO" labelEn="Vocabulary" title={bi('Ei kerrattavaa', 'Nothing due')}
      body="Your words come back here right before you'd forget them. Learn new words to fill the bank."
      ctaFi="Opi sanoja" ctaEn="Learn words" onCta={() => go('learn')} onExit={onExit} />
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
  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={BODY_BOTTOM + 14} />
  if (error) return <StatePane tone="error" title="Couldn't load the session" detail={error} bottom={BODY_BOTTOM + 14} />
  if (!data || data.length === 0) {
    return <EmptyTrack
      labelFi="OMAT LAUSEET" labelEn="Your sentences" title={bi('Ei kerrattavaa', 'Nothing due')}
      body="Build sentences from your own life in the Sentence Bank. They come back here to review, day by day."
      ctaFi="Lisää lauseita" ctaEn="Add sentences" onCta={() => go('islands')} onExit={onExit} />
  }
  return <RecallRunner key={data.map((it) => it.card.cardId).join(',')} items={data} userId={userId}
    titleFi="Omat lauseet" titleEn="Your sentences" onExit={onExit} onProgress={() => go('progress')} />
}

function EmptyTrack({ labelFi, labelEn, title, body, ctaFi, ctaEn, onCta, onExit }: {
  labelFi: string; labelEn: string; title: ReactNode; body: string
  ctaFi: string; ctaEn: string; onCta: () => void; onExit: () => void
}) {
  return (
    <ScreenScroll bottom={26}>
      <ExBar nav="back" onNav={onExit} center={<CenterLabel fi={labelFi} en={labelEn} />} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', textAlign: 'center', gap: 20 }}>
        <BrandMark size={120} />
        <div>
          <h2 className="ps-title-1">{title}</h2>
          <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10, maxWidth: 300 }}>{body}</p>
        </div>
        <CTA fi={ctaFi} en={ctaEn} iconRight="arrow" variant="ink" style={{ maxWidth: 320 }} onClick={onCta} />
      </div>
    </ScreenScroll>
  )
}
