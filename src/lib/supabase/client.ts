import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types.js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Keep users signed in across reloads and redeploys. These are the SDK
    // defaults, set explicitly so "remember me" is guaranteed.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
