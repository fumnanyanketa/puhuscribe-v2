import { useState } from 'react'
import { I } from './icons'
import { CTA, FieldArea } from './kit'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'
import { submitFeedback } from '../lib/data/feedback'

/* ---------------------------------------------------------------------------
 * Floating beta-feedback button + sheet. Rendered alongside the bottom nav, so
 * it appears on hub screens (not inside focused drills). One tap, a mood, a
 * note, send. Multilingual-friendly: emoji mood + Finnish-primary labels.
 * ------------------------------------------------------------------------- */

const MOODS: { v: number; emoji: string; fi: string; en: string }[] = [
  { v: 1, emoji: '😕', fi: 'Ei toimi', en: 'Needs work' },
  { v: 2, emoji: '🙂', fi: 'Ihan ok', en: 'Okay' },
  { v: 3, emoji: '😍', fi: 'Mahtava', en: 'Love it' },
]

export function FeedbackButton({ screen }: { screen?: string }) {
  const { user } = useAuth()
  const { bilingual } = useLang()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  const close = () => {
    setOpen(false)
    setTimeout(() => { setMessage(''); setRating(null); setSent(false); setErr('') }, 250)
  }

  const send = async () => {
    if (!message.trim() || busy) return
    setBusy(true); setErr('')
    try {
      await submitFeedback(user?.id ?? null, { message, rating, screen })
      setSent(true)
      setTimeout(close, 1600)
    } catch {
      // The note is backed up locally regardless; tell the tester it's saved.
      setSent(true)
      setTimeout(close, 1600)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* Floating launcher — sits just above the nav, right side */}
      <button onClick={() => setOpen(true)} aria-label="Send feedback" className="ps-press" style={{
        position: 'absolute', right: 16, bottom: 94, zIndex: 41, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 15px 10px 13px',
        borderRadius: 999, border: 'none', background: 'var(--written)', color: '#fff',
        boxShadow: '0 10px 24px -8px rgba(107,70,193,.55)',
      }}>
        <I name="chat" size={18} sw={2} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5 }}>Palaute</span>
      </button>

      {open && (
        <div onClick={close} style={{ position: 'absolute', inset: 0, zIndex: 60,
          background: 'rgba(15,14,32,.45)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: '100%', background: 'var(--paper)', borderTopLeftRadius: 'var(--r-2xl)', borderTopRightRadius: 'var(--r-2xl)',
            boxShadow: 'var(--sh-3)', padding: '22px 22px 26px', maxHeight: '88%', overflowY: 'auto' }}>

            {sent ? (
              <div style={{ textAlign: 'center', padding: '24px 0 10px' }}>
                <span style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--spoken)', color: '#fff',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <I name="check" size={34} sw={2.6} />
                </span>
                <h2 className="ps-title-2">Kiitos!</h2>
                {bilingual && <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 6 }}>Thank you — your feedback shapes the app.</p>}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 21, letterSpacing: '-0.02em', margin: 0 }}>Anna palautetta</h2>
                    {bilingual && <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 500, fontSize: 13, color: 'var(--ink-3)', margin: '2px 0 0' }}>Send feedback</p>}
                  </div>
                  <button onClick={close} aria-label="Close" className="ps-press" style={{
                    width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
                    background: 'var(--glass-deep)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <I name="close" size={18} sw={2} />
                  </button>
                </div>
                <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 8 }}>
                  You're an early tester. Tell us what works and what doesn't — it goes straight to the team.
                </p>

                {/* Mood */}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  {MOODS.map((m) => {
                    const on = rating === m.v
                    return (
                      <button key={m.v} onClick={() => setRating(on ? null : m.v)} className="ps-press" style={{
                        flex: 1, padding: '12px 6px', borderRadius: 'var(--r-md)', cursor: 'pointer',
                        background: on ? 'var(--written-bg)' : 'var(--paper)',
                        border: `1.5px solid ${on ? 'var(--written)' : 'var(--glass-line)'}`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      }}>
                        <span style={{ fontSize: 24, lineHeight: 1 }}>{m.emoji}</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, color: on ? 'var(--written)' : 'var(--ink-2)' }}>{m.fi}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Message */}
                <div style={{ marginTop: 14 }}>
                  <FieldArea value={message} onChange={setMessage} rows={4} autoFocus
                    placeholder={bilingual ? 'Mitä mietit? · What’s on your mind?' : 'Mitä mietit?'}
                    style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15.5 }} />
                </div>

                {err && (
                  <div className="ps-body" style={{ marginTop: 12, padding: '12px 16px', borderRadius: 'var(--r-md)',
                    background: 'var(--flag-bg)', color: 'var(--flag)' }}>{err}</div>
                )}

                <div style={{ marginTop: 16 }}>
                  <CTA fi={busy ? 'Lähetetään…' : 'Lähetä'} en={busy ? 'Sending' : 'Send'} icon="chat"
                    variant="ink" disabled={busy || !message.trim()} onClick={() => void send()} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
