import { createContext, useCallback, useContext, useState, ReactNode } from 'react'

/**
 * Bilingual label mode. The app teaches a zero-Finnish beginner, so every
 * control is labelled "Suomi · English" by default (the training wheels).
 * A learner can switch to Finnish-only once the UI is familiar; the choice is
 * persisted per browser. `bi(fi, en)` is the one helper screens use to render
 * a label in the current mode.
 */

const STORAGE_KEY = 'ps_bilingual'

/**
 * Render a bilingual label: the Finnish word dominant, with the English below it
 * in italic parentheses. In Finnish-only mode it returns just the Finnish string.
 */
export type Bi = (fi: string, en: string) => ReactNode

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
  bi: (fi) => fi,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [bilingual, setBilingualState] = useState<boolean>(readInitial)

  const setBilingual = useCallback((v: boolean) => {
    setBilingualState(v)
    try { localStorage.setItem(STORAGE_KEY, v ? '1' : '0') } catch { /* storage unavailable */ }
  }, [])

  const toggle = useCallback(() => setBilingual(!bilingual), [bilingual, setBilingual])

  // Finnish dominant; the English sits on the line below in faded italic parens.
  // Uses em-relative sizing so it scales with whatever context renders it
  // (eyebrow label, heading, button…). Finnish-only mode returns the bare string.
  const bi = useCallback<Bi>(
    (fi, en) =>
      bilingual ? (
        <span style={{ display: 'inline-block', lineHeight: 1.12 }}>
          {fi}
          <span style={{
            display: 'block', fontStyle: 'italic', fontWeight: 400, fontSize: '0.78em',
            opacity: 0.6, marginTop: 1, letterSpacing: 'normal', textTransform: 'none',
          }}>
            ({en})
          </span>
        </span>
      ) : (
        fi
      ),
    [bilingual],
  )

  return (
    <LangContext.Provider value={{ bilingual, setBilingual, toggle, bi }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
