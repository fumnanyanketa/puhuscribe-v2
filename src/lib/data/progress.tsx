import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { supabase } from '../supabase/client'
import type { Json } from '../supabase/database.types'
import { useAuth } from '../auth/useAuth'

/**
 * Cross-device learning progress: whether onboarding has been seen, and the
 * Day One Sprint position (which set, how far in). The DB (users.progress jsonb)
 * is the source of truth so resume follows the learner across devices; a
 * localStorage cache gives instant first paint and an offline fallback (and
 * keeps the app working before the 20260608000001 migration is run).
 */

export type SprintProgress = { size: number; idx: number; completed?: boolean }
export type UserProgress = { onboarded?: boolean; sprint?: SprintProgress }

const lsKey = (userId: string) => `puhuscribe:progress:${userId}`
const legacySprintKey = (userId: string) => `puhuscribe:dayone:${userId}`

export function readLocalProgress(userId: string): UserProgress {
  try {
    const raw = localStorage.getItem(lsKey(userId))
    if (raw) return JSON.parse(raw) as UserProgress
  } catch { /* ignore malformed cache */ }
  // Migrate the old per-user sprint key written by earlier builds.
  try {
    const old = localStorage.getItem(legacySprintKey(userId))
    if (old) {
      if (/^\d+$/.test(old)) return { sprint: { size: 150, idx: parseInt(old, 10) } }
      const o = JSON.parse(old)
      if (typeof o?.size === 'number' && typeof o?.idx === 'number') return { sprint: { size: o.size, idx: o.idx } }
    }
  } catch { /* ignore */ }
  return {}
}

function writeLocalProgress(userId: string, p: UserProgress): void {
  try { localStorage.setItem(lsKey(userId), JSON.stringify(p)) } catch { /* storage unavailable */ }
}

async function fetchProgress(userId: string): Promise<UserProgress | null> {
  try {
    const { data, error } = await supabase.from('users').select('progress').eq('id', userId).maybeSingle()
    if (error) return null // column/migration not there yet → fall back to local
    return (data?.progress as UserProgress | null) ?? {}
  } catch {
    return null
  }
}

async function saveProgress(userId: string, p: UserProgress): Promise<void> {
  writeLocalProgress(userId, p)
  try {
    await supabase.from('users').update({ progress: p as Json }).eq('id', userId)
  } catch { /* offline or no column yet — the localStorage cache holds it */ }
}

// Keep the furthest-along sprint (or the completed one); never lose progress.
function pickSprint(a?: SprintProgress, b?: SprintProgress): SprintProgress | undefined {
  if (!a) return b
  if (!b) return a
  if (a.completed && !b.completed) return a
  if (b.completed && !a.completed) return b
  return a.idx >= b.idx ? a : b
}

// Merge local cache and DB so neither source clobbers the other's progress.
function mergeProgress(a: UserProgress, b: UserProgress): UserProgress {
  const merged: UserProgress = {}
  if (a.onboarded || b.onboarded) merged.onboarded = true
  const sprint = pickSprint(a.sprint, b.sprint)
  if (sprint) merged.sprint = sprint
  return merged
}

interface ProgressCtx {
  progress: UserProgress
  ready: boolean // true once we know enough to route (DB resolved, or local fallback)
  markOnboarded: () => void
  saveSprint: (sprint: SprintProgress) => void
}

const Ctx = createContext<ProgressCtx>({
  progress: {}, ready: false, markOnboarded: () => {}, saveSprint: () => {},
})

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [progress, setProgress] = useState<UserProgress>({})
  const [ready, setReady] = useState(false)
  const progressRef = useRef<UserProgress>({})
  progressRef.current = progress

  useEffect(() => {
    if (!userId) { setProgress({}); setReady(false); return }

    const local = readLocalProgress(userId)
    setProgress(local)
    setReady(false)

    let active = true
    // Safety: never hang the app on routing if the network is slow.
    const fallback = setTimeout(() => { if (active) setReady(true) }, 4000)

    void fetchProgress(userId).then((db) => {
      if (!active) return
      // Merge — never let a stale DB row wipe a furthest-along local position.
      const merged = mergeProgress(local, db ?? {})
      setProgress(merged)
      writeLocalProgress(userId, merged)
      // If the DB is behind the merged result, push it up so devices converge.
      if (JSON.stringify(merged) !== JSON.stringify(db ?? {})) void saveProgress(userId, merged)
      setReady(true)
    })

    return () => { active = false; clearTimeout(fallback) }
  }, [userId])

  const update = useCallback((patch: Partial<UserProgress>) => {
    if (!userId) return
    const merged = { ...progressRef.current, ...patch }
    setProgress(merged)
    void saveProgress(userId, merged)
  }, [userId])

  const markOnboarded = useCallback(() => {
    if (!progressRef.current.onboarded) update({ onboarded: true })
  }, [update])

  const saveSprint = useCallback((sprint: SprintProgress) => update({ sprint }), [update])

  return <Ctx.Provider value={{ progress, ready, markOnboarded, saveSprint }}>{children}</Ctx.Provider>
}

export const useProgress = () => useContext(Ctx)
