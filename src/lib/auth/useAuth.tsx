import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../supabase/client'

interface AuthCtx {
  user: User | null
  session: Session | null
  loading: boolean
  isAnonymous: boolean // a "try without account" guest (no email yet)
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>({
  user: null, session: null, loading: true, isAnonymous: false, signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
      if (data.session) void bootstrapUser(data.session.user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s) void bootstrapUser(s.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{
      user: session?.user ?? null,
      session,
      loading,
      isAnonymous: Boolean(session?.user?.is_anonymous),
      signOut: () => supabase.auth.signOut().then(() => {}),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

async function bootstrapUser(user: User): Promise<void> {
  // Upsert and UPDATE the email on conflict, so when a guest converts to a real
  // account (updateUser sets their email, same id) the users row picks it up.
  await supabase
    .from('users')
    .upsert({ id: user.id, email: user.email ?? '' }, { onConflict: 'id' })
}
