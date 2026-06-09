/**
 * Screenshot harness entry. Renders the REAL app screens inside the real
 * provider tree (Lang / Auth / Progress), with the Supabase client mocked out
 * by vite.shots.config.ts. The screen is chosen by ?screen=NAME so the Playwright
 * driver (shots/capture.mjs) can load each page directly without clicking through
 * onboarding. ?sprint=open makes the mock user mid-sprint (Home resume state).
 * Not part of the production build.
 */
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts.css'
import '../src/styles/tokens.css'
import { AuthProvider } from '../src/lib/auth/useAuth'
import { LangProvider } from '../src/lib/lang/useLang'
import { ProgressProvider } from '../src/lib/data/progress'
import { AppScreen } from '../src/components/Shell'
import { Onboarding } from '../src/screens/Onboarding'
import { Home } from '../src/screens/Home'
import { DayOne } from '../src/screens/DayOne'
import { Learn } from '../src/screens/Learn'
import { Daily } from '../src/screens/Daily'
import { Islands } from '../src/screens/Islands'
import { Practice } from '../src/screens/Practice'
import { Listen } from '../src/screens/Listen'
import { Read } from '../src/screens/Read'
import { Write } from '../src/screens/Write'
import { Progress } from '../src/screens/Progress'
import { Auth } from '../src/screens/Auth'

function Harness() {
  const params = new URLSearchParams(location.search)
  const initial = (params.get('screen') as AppScreen | 'auth') || 'home'
  const [screen, setScreen] = useState<AppScreen | 'auth'>(initial)
  const go = (s: AppScreen) => setScreen(s)

  if (screen === 'auth') return <div className="ps-app-frame"><Auth /></div>

  const screens: Record<AppScreen, React.ReactNode> = {
    onboarding: <Onboarding go={go} />,
    home: <Home go={go} />,
    dayone: <DayOne go={go} />,
    learn: <Learn go={go} />,
    daily: <Daily go={go} />,
    islands: <Islands go={go} />,
    practice: <Practice go={go} />,
    listen: <Listen go={go} />,
    read: <Read go={go} />,
    write: <Write go={go} />,
    progress: <Progress go={go} />,
  }
  return <div className="ps-app-frame">{screens[screen]}</div>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <AuthProvider>
        <ProgressProvider>
          <Harness />
        </ProgressProvider>
      </AuthProvider>
    </LangProvider>
  </StrictMode>,
)
