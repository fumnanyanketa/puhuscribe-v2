/**
 * Screenshot harness entry. Renders the REAL app screens inside the real
 * provider tree (Lang / Auth / Progress), with the Supabase client mocked out
 * by vite.shots.config.ts. The screen is chosen by ?screen=NAME so the Playwright
 * driver (shots/capture.mjs) can load each page directly without clicking through
 * onboarding. Not part of the production build.
 */
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts.css'
import '../src/styles/tokens.css'
import { AuthProvider } from '../src/lib/auth/useAuth'
import { LangProvider } from '../src/lib/lang/useLang'
import { ProgressProvider } from '../src/lib/data/progress'
import { BottomNav, AppScreen } from '../src/components/Shell'
import { Onboarding } from '../src/screens/Onboarding'
import { DayOne } from '../src/screens/DayOne'
import { Daily } from '../src/screens/Daily'
import { Islands } from '../src/screens/Islands'
import { Practice } from '../src/screens/Practice'
import { Listen } from '../src/screens/Listen'
import { Write } from '../src/screens/Write'
import { Progress } from '../src/screens/Progress'
import { Auth } from '../src/screens/Auth'

const APP_SCREENS: AppScreen[] = ['dayone', 'daily', 'islands', 'practice', 'progress']

function Harness() {
  const params = new URLSearchParams(location.search)
  const initial = (params.get('screen') as AppScreen | 'auth') || 'daily'
  const [screen, setScreen] = useState<AppScreen | 'auth'>(initial)
  const go = (s: AppScreen) => setScreen(s)

  if (screen === 'auth') return <div className="ps-app-frame"><Auth /></div>

  const screens: Record<AppScreen, React.ReactNode> = {
    onboarding: <Onboarding go={go} />,
    dayone: <DayOne go={go} />,
    daily: <Daily go={go} />,
    islands: <Islands />,
    practice: <Practice go={go} />,
    listen: <Listen go={go} />,
    write: <Write go={go} />,
    progress: <Progress go={go} />,
  }
  const showNav = APP_SCREENS.includes(screen)
  return (
    <div className="ps-app-frame">
      {screens[screen]}
      {showNav && <BottomNav active={screen} onNav={go} />}
    </div>
  )
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
