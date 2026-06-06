import { useEffect, useState } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Run an async function once (or when `deps` change) and track its
 * loading / error / data state. Guards against setting state after unmount.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null })

  useEffect(() => {
    let active = true
    setState({ data: null, loading: true, error: null })
    fn()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null })
      })
      .catch((e: unknown) => {
        if (active) setState({ data: null, loading: false, error: e instanceof Error ? e.message : String(e) })
      })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
