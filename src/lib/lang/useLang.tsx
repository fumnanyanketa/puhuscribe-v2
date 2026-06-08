import { createContext, useCallback, useContext, useState, ReactNode } from 'react'

/**
 * Bilingual label mode. The app teaches a zero-Finnish beginner, so every
 * control is labelled "Suomi · English" by default (the training wheels).
 * A learner can switch to Finnish-only once the UI is familiar; the choice is
 * persisted per browser. `bi(fi, en)` is the one helper screens use to render
 * a label in the current mode.
 */

const STORAGE_KEY = 'ps_bilingual'

/** Render a label in the active mode: "fi · en" when bilingual, just "fi" otherwise. */
export type Bi = (fi: string, en: string) => string

function readInitial(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === null ? true : v === '1'
  } catch {
    return true
  }
}

interface LangCtx {
  bilingual: boolean
  setBilingual: (v: boolean) => void
  toggle: () => void
  bi: Bi
}

const LangContext = createContext<LangCtx>({
  bilingual: true,
  setBilingual: () => {},
  toggle: () => {},
  bi: (fi, en) => `${fi} · ${en}`,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [bilingual, setBilingualState] = useState<boolean>(readInitial)

  const setBilingual = useCallback((v: boolean) => {
    setBilingualState(v)
    try { localStorage.setItem(STORAGE_KEY, v ? '1' : '0') } catch { /* storage unavailable */ }
  }, [])

  const toggle = useCallback(() => setBilingual(!bilingual), [bilingual, setBilingual])

  const bi = useCallback<Bi>((fi, en) => (bilingual ? `${fi} · ${en}` : fi), [bilingual])

  return (
    <LangContext.Provider value={{ bilingual, setBilingual, toggle, bi }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
