import { useState, CSSProperties } from 'react'
import { I } from './icons'
import { CTA } from './kit'
import { supabase } from '../lib/supabase/client'
import { useLang } from '../lib/lang/useLang'

/* ---------------------------------------------------------------------------
 * "Save your progress" — converts a guest (anonymous) account into a real
 * email account IN PLACE via supabase.auth.updateUser. The user id stays the
 * same, so every word, sentence and review they built as a guest is kept; they
 * can now log in on any device. Controlled bottom sheet, reused from Home and
 * Progress.
 * ------------------------------------------------------------------------- */

const inputStyle: CSSProperties = {
  width: '100%', padding: '14px 16px', borderRadius: 'var(--r-lg)',
  border: '1px solid var(--glass-line)', background: '#fff', boxShadow: 'var(--sh-1)',
  fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15.5, color: 'var(--ink)', outline: 'none',
}

export function SaveProgressSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { bilingual } = useLang()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)

  const close = () => {
    onClose()
    setTimeout(() => { setEmail(''); setPassword(''); setErr(''); setDone(false) }, 250)
  }

  const save = async () => {
    if (busy) return
    if (!email.trim() || password.length < 6) { setErr('Enter an email and a password of at least 6 characters.'); return }
    setBusy(true); setErr('')
    const { error } = await supabase.auth.updateUser({ email: email.trim(), password })
    if (error) { setErr(error.message); setBusy(false); return }
    // onAuthStateChange (USER_UPDATED) flips isAnonymous false + bootstraps the email.
    setDone(true); setBusy(false)
    setTimeout(close, 1700)
  }

  if (!open) return null
  return (
    <div onClick={close} style={{ position: 'absolute', inset: 0, zIndex: 60,
      background: 'rgba(15,14,32,.45)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', background: 'var(--paper)', borderTopLeftRadius: 'var(--r-2xl)', borderTopRightRadius: 'var(--r-2xl)',
        boxShadow: 'var(--sh-3)', padding: '22px 22px 26px', maxHeight: '90%', overflowY: 'auto' }}>

        {done ? (
          <div style={{ textAlign: 'center', padding: '24px 0 10px' }}>
            <span style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--spoken)', color: '#fff',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <I name="check" size={34} sw={2.6} />
            </span>
            <h2 className="ps-title-2">Tallennettu!</h2>
            {bilingual && <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 6 }}>Saved — you can now log in on any device.</p>}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 21, letterSpacing: '-0.02em', margin: 0 }}>Tallenna edistymisesi</h2>
                {bilingual && <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 500, fontSize: 13, color: 'var(--ink-3)', margin: '2px 0 0' }}>Save your progress</p>}
              </div>
              <button onClick={close} aria-label="Close" className="ps-press" style={{
                width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
                background: 'var(--glass-deep)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I name="close" size={18} sw={2} />
              </button>
            </div>
            <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 8 }}>
              Add an email and password and everything you've built so far is kept — and you can log in on any device.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email" placeholder="you@example.com" style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'var(--written)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--glass-line)')} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password" placeholder="Password (at least 6 characters)" style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'var(--written)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--glass-line)')} />
            </div>

            {err && (
              <div className="ps-body" style={{ marginTop: 12, padding: '12px 16px', borderRadius: 'var(--r-md)',
                background: 'var(--flag-bg)', color: 'var(--flag)' }}>{err}</div>
            )}

            <div style={{ marginTop: 16 }}>
              <CTA fi={busy ? 'Tallennetaan…' : 'Tallenna tili'} en={busy ? 'Saving' : 'Save account'}
                icon="check" variant="ink" disabled={busy || !email.trim() || password.length < 6} onClick={() => void save()} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
