import { useState, FormEvent } from 'react'
import { OrbCluster } from '../components/primitives'
import { Btn } from '../components/ui'
import { PuhuMark } from '../components/Shell'
import { supabase } from '../lib/supabase/client'

type Mode = 'signin' | 'signup'

export function Auth() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(false)

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 28px', textAlign: 'center', gap: 20 }}>
        <OrbCluster size={160} />
        <div>
          <div className="ps-label" style={{ color: 'var(--written)', marginBottom: 10 }}>Tarkista sähköpostisi</div>
          <h2 className="ps-title-1">Confirm your email</h2>
          <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 12 }}>
            We sent a link to <strong>{email}</strong>. Click it to activate your account, then come back here.
          </p>
        </div>
        <button onClick={() => { setSignedUp(false); setMode('signin') }} className="ps-press"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--written)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14 }}>
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '48px 28px 36px' }}>
      <PuhuMark size={19} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <OrbCluster size={140} />
        </div>

        <div>
          <h1 className="ps-title-1">
            {mode === 'signin' ? 'Kirjaudu sisään' : 'Luo tili'}
          </h1>
          <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 8 }}>
            {mode === 'signin' ? 'Sign in to continue.' : 'Create your account — your Finnish starts here.'}
          </p>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', background: 'var(--glass-deep)', borderRadius: 'var(--r-pill)', padding: 4, gap: 4 }}>
          {(['signin', 'signup'] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setError('') }}
              className="ps-press"
              style={{
                flex: 1, padding: '10px 0', borderRadius: 'var(--r-pill)', border: 'none',
                cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
                background: mode === m ? 'var(--paper)' : 'transparent',
                color: mode === m ? 'var(--ink)' : 'var(--ink-3)',
                boxShadow: mode === m ? 'var(--sh-1)' : 'none',
                transition: 'background .15s, color .15s',
              }}>
              {m === 'signin' ? 'Kirjaudu · Log in' : 'Luo tili · Sign up'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="ps-caption" style={{ display: 'block', marginBottom: 7, color: 'var(--ink-2)' }}>
              Sähköposti · Email
            </label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required autoComplete="email" placeholder="you@example.com"
              style={{
                width: '100%', padding: '15px 18px', borderRadius: 'var(--r-md)',
                border: '1.5px solid var(--glass-line)', background: 'var(--glass)',
                fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15, color: 'var(--ink)',
                outline: 'none', transition: 'border-color .15s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--written)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--glass-line)'}
            />
          </div>

          <div>
            <label className="ps-caption" style={{ display: 'block', marginBottom: 7, color: 'var(--ink-2)' }}>
              Salasana · Password
            </label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              placeholder="At least 6 characters"
              style={{
                width: '100%', padding: '15px 18px', borderRadius: 'var(--r-md)',
                border: '1.5px solid var(--glass-line)', background: 'var(--glass)',
                fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15, color: 'var(--ink)',
                outline: 'none', transition: 'border-color .15s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--written)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--glass-line)'}
            />
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--flag-bg)', color: 'var(--flag)' }}
              className="ps-body">
              {error}
            </div>
          )}

          <Btn variant="primary" block onClick={() => submit()} disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'One moment…' : mode === 'signin' ? 'Kirjaudu sisään · Log in' : 'Luo tili · Create account'}
          </Btn>
        </form>
      </div>
    </div>
  )
}
