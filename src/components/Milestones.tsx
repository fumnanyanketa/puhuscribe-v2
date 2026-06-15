import { I } from './icons'
import { Bar } from './ui'
import { useLang } from '../lib/lang/useLang'
import { ladder, rankState } from '../lib/milestones'

/* ---------------------------------------------------------------------------
 * The milestone ladder — the visible "climb" of word-count ranks beneath the
 * journey stages. Rendered on Progress; a compact rank summary (RankChip) sits
 * on the Home dashboard.
 * ------------------------------------------------------------------------- */

/** Compact one-line rank/next-milestone summary for the Home dashboard footer. */
export function RankSummary({ words }: { words: number }) {
  const { bilingual } = useLang()
  const s = rankState(words)
  const emoji = s.rank ? s.rank.emoji : '🎯'
  const fi = s.rank ? s.rank.fi : 'Ensimmäinen merkkipaalu'
  const en = s.rank ? s.rank.en : 'first milestone'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>{emoji}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12.5, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{fi}</span>
      {bilingual && (
        <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 500, fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{en}</span>
      )}
      {s.next && (
        <span className="ps-num" style={{ marginLeft: 'auto', flexShrink: 0, fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11.5, color: 'var(--written)', whiteSpace: 'nowrap' }}>
          {s.toNext} →
        </span>
      )}
    </div>
  )
}

export function MilestoneLadder({ words }: { words: number }) {
  const { bi, bilingual } = useLang()
  const rungs = ladder(words)
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {rungs.map((r) => {
        const m = r.milestone
        return (
          <div key={m.words} style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '10px 0' }}>
            <span style={{ flexShrink: 0, width: 38, height: 38, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: r.done ? 'var(--spoken)' : r.current ? 'var(--written)' : 'var(--glass-deep)',
              color: r.done ? '#fff' : r.current ? '#fff' : 'var(--ink-3)',
              boxShadow: r.current ? '0 0 0 5px var(--written-bg)' : 'none' }}>
              {r.done ? <I name="check" size={19} sw={2.6} /> : r.current ? <span style={{ fontSize: 17 }}>{m.emoji}</span> : <I name="lock" size={16} sw={1.9} />}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
                  color: r.done || r.current ? 'var(--ink)' : 'var(--ink-3)' }}>{m.words} {bi('sanaa', 'words')}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 500, fontSize: 12,
                  color: 'var(--ink-3)' }}>{bilingual ? `${m.fi} · ${m.en}` : m.fi}</span>
              </span>
              {r.current && (
                <span style={{ display: 'block', marginTop: 7 }}>
                  <Bar value={r.pct} color="var(--written)" track="var(--glass-deep)" h={6} />
                  <span className="ps-num" style={{ display: 'block', marginTop: 4, fontFamily: 'var(--font-body)',
                    fontWeight: 600, fontSize: 12, color: 'var(--written)' }}>
                    {words} / {m.words} — {m.words - words} {bi('jäljellä', 'to go')}
                  </span>
                </span>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}
