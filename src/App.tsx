import React, { useEffect, useState } from 'react'
import './styles/tokens.css'
import { BottomNav, AppScreen } from './components/Shell'
import { StatePane } from './components/StatePane'
import { Onboarding } from './screens/Onboarding'
import { DayOne } from './screens/DayOne'
import { Daily } from './screens/Daily'
import { Island } from './screens/Island'
import { Progress } from './screens/Progress'
import { Auth } from './screens/Auth'
import { useAuth } from './lib/auth/useAuth'
import { useProgress, UserProgress } from './lib/data/progress'

// Screens that show the bottom navigation.
const APP_SCREENS: AppScreen[] = ['dayone', 'daily', 'island', 'progress']

// Where a signed-in user lands when they open the app:
//   never onboarded        → Onboarding (→ Day One Sprint)
//   sprint finished a set   → Daily review (the next step in the journey)
//   otherwise               → Day One Sprint (start, or resume where they left off)
function landingScreen(progress: UserProgress): AppScreen {
  // Having any sprint progress implies onboarding was already seen.
  const seen = progress.onboarded || Boolean(progress.sprint)
  if (!seen) return 'onboarding'
  if (progress.sprint?.completed) return 'daily'
  return 'dayone'
}

export default function App() {
  const { user, loading } = useAuth()
  const { progress, ready } = useProgress()
  const [screen, setScreen] = useState<AppScreen | null>(null)
  const go = (s: AppScreen) => setScreen(s)

  // Pick the landing screen once, after progress resolves.
  useEffect(() => {
    if (user && ready && screen === null) setScreen(landingScreen(progress))
  }, [user, ready, screen, progress])

  // Reset the landing decision on sign-out so the next user routes fresh.
  useEffect(() => {
    if (!user && screen !== null) setScreen(null)
  }, [user, screen])

  // Auth gate: resolve the session first, then require sign-in.
  if (loading) {
    return <div className="ps-app-frame"><StatePane title="Ladataan…" /></div>
  }
  if (!user) {
    return <div className="ps-app-frame"><Auth /></div>
  }
  if (!ready || screen === null) {
    return <div className="ps-app-frame"><StatePane title="Ladataan…" /></div>
  }

  const screens: Record<AppScreen, React.ReactNode> = {
    onboarding: <Onboarding go={go} />,
    dayone:     <DayOne go={go} />,
    daily:      <Daily go={go} />,
    island:     <Island go={go} />,
    progress:   <Progress go={go} />,
  }

  const showNav = APP_SCREENS.includes(screen)

  return (
    <div className="ps-app-frame">
      {screens[screen]}
      {showNav && <BottomNav active={screen} onNav={go} />}
    </div>
  )
}
