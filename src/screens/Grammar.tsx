import { useState } from 'react'
import { I } from '../components/icons'
import { CTA, ExBar, CenterLabel, Eyebrow, IconTile, StackLabel, OptionRow } from '../components/kit'
import { ScreenScroll, AppScreen } from '../components/Shell'
import { useLang } from '../lib/lang/useLang'
import { useProgress } from '../lib/data/progress'
import { useStudyClock } from '../lib/studyTime'
import { GRAMMAR, GrammarLesson } from '../lib/grammar'

/* ---------------------------------------------------------------------------
 * Grammar (Stage 2). Unlocks only after the Foundation sprint. Lessons unlock
 * one at a time (finish one to open the next), so the curriculum stays
 * step-by-step. Reached from the Learn tab; a focused sub-screen (no nav bar).
 * ------------------------------------------------------------------------- */

const BODY_BOTTOM = 26

export function Grammar({ go }: { go: (s: AppScreen) => void }) {
  const { progress, markGrammarDone } = useProgress()
  const { bi } = useLang()
  const [openId, setOpenId] = useState<string | null>(null)

  const sprintDone = Boolean(progress.sprint?.completed)
  const done = progress.grammar ?? []

  // Locked until the first sprint is complete.
  if (!sprintDone) {
    return (
      <ScreenScroll bottom={BODY_BOTTOM}>
        <ExBar nav="close" onNav={() => go('learn')} center={<CenterLabel fi="KIELIOPPI" en="Grammar" />} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          alignItems: 'center', textAlign: 'center', gap: 22 }}>
          <IconTile icon="lock" size={64} r={20} color="var(--ink-3)" bg="var(--glass-deep)" />
          <div>
            <h2 className="ps-title-1">Kielioppi avautuu pian</h2>
            <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10, maxWidth: 300 }}>
              Finish your first 150-word sprint first. Once the words feel familiar, grammar makes sense fast.
            </p>
          </div>
          <CTA fi="Jatka sprinttiä" en="Go to the sprint" icon="sparkle" variant="ink" style={{ maxWidth: 320 }} onClick={() => go('dayone')} />
        </div>
      </ScreenScroll>
    )
  }

  // A lesson is unlocked if it is the first, or the previous one is done.
  const isUnlocked = (i: number) => i === 0 || done.includes(GRAMMAR[i - 1].id)

  const open = openId ? GRAMMAR.find((l) => l.id === openId) : null
  if (open) {
    return (
      <LessonView
        lesson={open}
        onBack={() => setOpenId(null)}
        onDone={() => { markGrammarDone(open.id); setOpenId(null) }}
      />
    )
  }

  const doneCount = GRAMMAR.filter((l) => done.includes(l.id)).length

  return (
    <ScreenScroll bottom={BODY_BOTTOM}>
      <ExBar nav="close" onNav={() => go('learn')} center={<CenterLabel fi="KIELIOPPI" en="Grammar" />} />

      <div style={{ marginTop: 16 }}>
        <Eyebrow fi="VAIHE 2 · KIELIOPPI" en="Stage 2 · Grammar" color="var(--written)" style={{ marginBottom: 10 }} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 25,
          letterSpacing: '-0.03em', color: 'var(--ink)', margin: 0 }}>Miten suomi toimii</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14.5, lineHeight: 1.5,
          color: 'var(--ink-2)', margin: '10px 0 0', textWrap: 'pretty' }}>
          Step by step, from the very beginning. Each lesson explains the why, then unlocks the next.
          <span className="ps-num" style={{ color: 'var(--ink-3)' }}> {doneCount}/{GRAMMAR.length}</span>
        </p>
      </div>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {GRAMMAR.map((l, i) => {
          const unlocked = isUnlocked(i)
          const isDone = done.includes(l.id)
          return (
            <button key={l.id} disabled={!unlocked} onClick={() => unlocked && setOpenId(l.id)}
              className={unlocked ? 'ps-card ps-press' : 'ps-card'} style={{
                padding: 16, borderRadius: 'var(--r-lg)', width: '100%', textAlign: 'left',
                border: 'none', cursor: unlocked ? 'pointer' : 'default', opacity: unlocked ? 1 : 0.55,
                display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isDone ? 'var(--spoken-bg)' : 'var(--written-bg)',
                color: isDone ? 'var(--spoken)' : 'var(--written)',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>
                {isDone ? <I name="check" size={20} sw={2.6} /> : !unlocked ? <I name="lock" size={17} sw={1.9} /> : i + 1}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.3, color: 'var(--ink)' }}>{l.titleFi}</span>
                  <span className="ps-label" style={{ color: 'var(--ink-3)' }}>{l.level}</span>
                </span>
                <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontStyle: 'italic',
                  fontWeight: 500, fontSize: 12.5, color: 'var(--ink-3)' }}>{l.titleEn}</span>
              </span>
              {unlocked && <span style={{ color: 'var(--ink-3)', flexShrink: 0 }}><I name="arrow" size={20} sw={2} /></span>}
            </button>
          )
        })}
      </div>

      <p className="ps-caption" style={{ textAlign: 'center', marginTop: 22 }}>
        {bi('Lisää oppitunteja tulossa', 'More lessons on the way')}
      </p>
    </ScreenScroll>
  )
}

function LessonView({ lesson, onBack, onDone }: {
  lesson: GrammarLesson; onBack: () => void; onDone: () => void
}) {
  const { bilingual } = useLang()
  useStudyClock()
  const [picked, setPicked] = useState<string | null>(null)

  return (
    <ScreenScroll bottom={BODY_BOTTOM}>
      <ExBar nav="back" onNav={onBack} center={<CenterLabel fi={lesson.level} en={lesson.titleEn} color="var(--written)" />} />

      <div style={{ marginTop: 16 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24,
          letterSpacing: '-0.03em', color: 'var(--ink)', margin: 0 }}>{lesson.titleFi}</h1>
        {bilingual && (
          <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 500, fontSize: 13.5, color: 'var(--ink-3)', margin: '4px 0 0' }}>
            {lesson.titleEn}
          </p>
        )}
        {/* Why it matters */}
        <div className="ps-card" style={{ marginTop: 14, padding: '14px 16px', borderRadius: 'var(--r-lg)',
          background: 'var(--written-bg)', display: 'flex', gap: 11, alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--written)', flexShrink: 0, marginTop: 1 }}><I name="star" size={18} sw={1.9} /></span>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13.8, lineHeight: 1.45, color: 'var(--ink)', margin: 0 }}>
            {lesson.why}
          </p>
        </div>
      </div>

      {/* Teaching blocks */}
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {lesson.blocks.map((b, i) => (
          <div key={i}>
            {b.heading && (
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', marginBottom: 6 }}>{b.heading}</div>
            )}
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink-2)', margin: 0, textWrap: 'pretty' }}>{b.body}</p>
            {b.examples && b.examples.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {b.examples.map((ex, k) => (
                  <div key={k} className="ps-card" style={{ padding: '12px 14px', borderRadius: 'var(--r-md)',
                    borderLeft: '3px solid var(--written)' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16.5, color: 'var(--ink)' }}>{ex.fi}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13.5, color: 'var(--ink-2)', marginTop: 2 }}>{ex.en}</div>
                    {ex.note && <div className="ps-caption" style={{ marginTop: 4, color: 'var(--ink-3)' }}>{ex.note}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick check */}
      {lesson.check && (
        <div style={{ marginTop: 26 }}>
          <StackLabel fi="TARKISTA" en="Quick check" color="var(--written)" />
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16.5, color: 'var(--ink)', margin: '10px 0 12px' }}>
            {lesson.check.q}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lesson.check.options.map((opt) => {
              const correct = opt === lesson.check!.answer
              const chosen = picked === opt
              const state = picked ? (correct ? 'correct' : chosen ? 'wrong' : null) : null
              return (
                <OptionRow key={opt} disabled={!!picked} state={state} onClick={() => setPicked(opt)}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    {opt}
                    {picked && correct && <span style={{ color: 'var(--spoken)' }}><I name="check" size={20} sw={2.4} /></span>}
                    {picked && chosen && !correct && <span style={{ color: '#C2603F' }}><I name="close" size={20} sw={2.4} /></span>}
                  </span>
                </OptionRow>
              )
            })}
          </div>
          {picked && lesson.check.explain && (
            <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 12 }}>{lesson.check.explain}</p>
          )}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 20 }} />
      <CTA fi="Valmis" en="Done" iconRight="arrow" variant="ink"
        style={{ marginTop: 16 }} disabled={!!lesson.check && !picked} onClick={onDone} />
      {lesson.check && !picked && (
        <p className="ps-caption" style={{ textAlign: 'center', marginTop: 8 }}>Answer the check to continue</p>
      )}
    </ScreenScroll>
  )
}
