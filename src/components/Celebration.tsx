import { CTA } from './kit'
import { useLang } from '../lib/lang/useLang'
import { Milestone } from '../lib/milestones'

/* ---------------------------------------------------------------------------
 * Celebration overlay — the pop when a learner crosses a word milestone. Shown
 * over the current screen; dismiss to continue. The reward that makes the
 * milestone ladder feel good.
 * ------------------------------------------------------------------------- */

const CONFETTI = [
  { c: 'var(--written)', top: '16%', left: '14%', r: '20deg' },
  { c: 'var(--spoken)', top: '20%', right: '15%', r: '-15deg' },
  { c: 'var(--flag)', top: '30%', left: '22%', r: '40deg' },
  { c: '#E0A53F', top: '26%', right: '24%', r: '-30deg' },
]

export function Celebration({ milestone, onClose }: { milestone: Milestone; onClose: () => void }) {
  const { bi } = useLang()
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 70,
      background: 'rgba(20,14,40,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {CONFETTI.map((p, i) => (
        <span key={i} style={{ position: 'absolute', width: 9, height: 14, borderRadius: 2, opacity: .9,
          background: p.c, top: p.top, left: p.left, right: p.right, transform: `rotate(${p.r})` }} />
      ))}
      <div onClick={(e) => e.stopPropagation()} className="ps-card" style={{
        width: '100%', maxWidth: 360, borderRadius: 30, padding: '28px 22px', textAlign: 'center', boxShadow: 'var(--sh-3)' }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', margin: '0 auto 14px', fontSize: 46,
          background: 'linear-gradient(150deg, var(--orb-violet), var(--orb-deep))',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{milestone.emoji}</div>
        <div className="ps-label" style={{ color: 'var(--written)' }}>UUSI VIRSTANPYLVÄS · Milestone</div>
        <h2 className="ps-title-1" style={{ marginTop: 6 }}>{milestone.words} sanaa!</h2>
        <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 8, maxWidth: 300, marginInline: 'auto' }}>
          You've learned {milestone.words} Finnish words. Keep going!
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 14, padding: '7px 14px',
          borderRadius: 999, background: 'var(--written-bg)', color: 'var(--written)', fontWeight: 700, fontSize: 13 }}>
          <span>{milestone.emoji}</span><span>{bi(milestone.fi, milestone.en)}</span>
        </div>
        <CTA fi="Jatka" en="Keep going" iconRight="arrow" variant="ink" style={{ marginTop: 18 }} onClick={onClose} />
      </div>
    </div>
  )
}
