import { useState, FormEvent, CSSProperties } from 'react'
import { BrandMark } from '../components/primitives'
import { CTA } from '../components/kit'
import { PuhuMark } from '../components/Shell'
import { supabase } from '../lib/supabase/client'
import { useLang } from '../lib/lang/useLang'

type Mode = 'signin' | 'signup'

const inputStyle: CSSProperties = {
  width: '100%', padding: '15px 18px', borderRadius: 'var(--r-lg)',
  border: '1px solid var(--glass-line)', background: '#fff', boxShadow: 'var(--sh-1)',
  fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15.8, color: 'var(--ink)',
  outline: 'none', transition: 'border-color .15s',
}

function FieldLabel({ fi, en }: { fi: string; en: string }) {
  const { bilingual } = useLang()
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14.9, color: 'var(--ink)' }}>{fi}</div>
      {bilingual && (
        <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11.5, color: 'var(--ink-3)' }}>{en}</div>
      )}
    </div>
  )
}

export function Auth() {
  const { bilingual } = useLang()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) setError(err.message)
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password })
        if (err) setError(err.message)
        else setSignedUp(true)
      }
    } finally {
      setLoading(false)
    }
  }

  if (signedUp) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100%', padding: '0 28px', textAlign: 'center', gap: 20 }}>
        <BrandMark size={120} />
        <div>
          <div className="ps-label" style={{ color: 'var(--written)', marginBottom: 10 }}>Tarkista sähköpostisi</div>
          <h2 className="ps-title-1">Confirm your email</h2>
          <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 12 }}>
            We sent a link to <strong>{email}</strong>. Click it to activate your account, then come back here.
          </p>
        </div>
        <button onClick={() => { setSignedUp(false); setMode('signin') }} className="ps-press"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--written)',
            fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14 }}>
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <div className="ps-noscroll" style={{ position: 'absolute', inset: 0, overflowY: 'auto',
      display: 'flex', flexDirection: 'column', padding: '56px 26px 30px' }}>
      <PuhuMark size={21} />

      <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <BrandMark size={72} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 27.4,
          letterSpacing: '-0.035em', lineHeight: 1, color: 'var(--ink)', margin: 0 }}>
          {mode === 'signin' ? 'Kirjaudu sisään' : 'Luo tili'}
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14.9, color: 'var(--ink-2)', margin: '8px 0 0' }}>
          {mode === 'signin' ? 'Sign in to continue.' : 'Create your account. Your Finnish starts here.'}
        </p>

        {/* Mode tabs */}
        <div style={{ display: 'flex', padding: 6, borderRadius: 999, background: 'var(--glass-deep)', marginTop: 20, gap: 4 }}>
          {([['signin', 'Kirjaudu', 'Log in'], ['signup', 'Luo tili', 'Sign up']] as const).map(([m, fi, en]) => {
            const on = mode === m
            return (
              <button key={m} onClick={() => { setMode(m); setError('') }} className="ps-press" style={{
                flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: on ? '#fff' : 'transparent', boxShadow: on ? 'var(--sh-1)' : 'none',
                transition: 'background .15s',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.9, color: on ? 'var(--ink)' : 'var(--ink-3)' }}>{fi}</div>
                {bilingual && (
                  <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'var(--ink-3)' }}>{en}</div>
                )}
              </button>
            )
          })}
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', marginTop: 20 }}>
          <FieldLabel fi="Sähköposti" en="Email" />
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            required autoComplete="email" placeholder="you@example.com" style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = 'var(--written)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--glass-line)')}
          />

          <div style={{ marginTop: 14 }}>
            <FieldLabel fi="Salasana" en="Password" />
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                required autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                placeholder="At least 6 characters"
                style={{ ...inputStyle, paddingRight: 46 }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--written)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--glass-line)')}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="ps-press"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)',
                  padding: 8, display: 'flex', alignItems: 'center' }}>
                {showPw
                  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.4 18.4 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22M6.61 6.61A18.4 18.4 0 0 0 1 12s4 8 11 8a9.1 9.1 0 0 0 5.39-1.61" /></svg>
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></svg>}
              </button>
            </div>
          </div>

          {error && (
            <div className="ps-body" style={{ marginTop: 14, padding: '12px 16px', borderRadius: 'var(--r-md)',
              background: 'var(--flag-bg)', color: 'var(--flag)' }}>
              {error}
            </div>
          )}
        </form>
      </div>

      <div style={{ flex: 1, minHeight: 16 }} />
      <CTA variant="ink" disabled={loading} onClick={() => void submit()}
        fi={loading ? 'Hetki…' : mode === 'signin' ? 'Kirjaudu sisään' : 'Luo tili'}
        en={loading ? 'One moment' : mode === 'signin' ? 'Log in' : 'Create account'} />
    </div>
  )
}
