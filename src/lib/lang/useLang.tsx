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

// Plain-string variant for places that need a string, not a node (input
// placeholders, aria labels, anything interpolated into a template literal).
// Using `bi()` there renders "[object Object]".
export type BiText = (fi: string, en: string) => string

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
  biText: BiText
}

const LangContext = createContext<LangCtx>({
  bilingual: true,
  setBilingual: () => {},
  toggle: () => {},
  bi: (fi) => fi,
  biText: (fi) => fi,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [bilingual, setBilingualState] = useState<boolean>(readInitial)

  const setBilingual = useCallback((v: boolean) => {
    setBilingualState(v)
    try { localStorage.setItem(STORAGE_KEY, v ? '1' : '0') } catch { /* storage unavailable */ }
  }, [])

  const toggle = useCallback(() => setBilingual(!bilingual), [bilingual, setBilingual])

  // Finnish dominant; the English sits quietly on the line below as a muted
  // secondary — no parentheses, no italic (the owner found the bracketed gloss
  // "isolated and cheap"). Muted ink-3, medium weight; em-relative so it scales
  // with whatever context renders it. Finnish-only mode returns the bare string.
  const bi = useCallback<Bi>(
    (fi, en) =>
      bilingual ? (
        <span style={{ display: 'inline-block', lineHeight: 1.12, verticalAlign: 'top' }}>
          {fi}
          <span style={{
            display: 'block', fontWeight: 500, fontSize: '0.72em',
            color: 'var(--ink-3)', marginTop: 1, letterSpacing: 'normal', textTransform: 'none',
          }}>
            {en}
          </span>
        </span>
      ) : (
        fi
      ),
    [bilingual],
  )

  // Plain-string label for string-only contexts (placeholders, template literals).
  // A thin middot pairs the two inline, with no brackets.
  const biText = useCallback<BiText>((fi, en) => (bilingual ? `${fi} · ${en}` : fi), [bilingual])

  return (
    <LangContext.Provider value={{ bilingual, setBilingual, toggle, bi, biText }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
