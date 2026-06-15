import React, { useEffect, useState } from 'react'
import './styles/tokens.css'
import { AppScreen } from './components/Shell'
import { StatePane } from './components/StatePane'
import { Onboarding } from './screens/Onboarding'
import { Home } from './screens/Home'
import { DayOne } from './screens/DayOne'
import { Learn } from './screens/Learn'
import { Daily } from './screens/Daily'
import { Islands } from './screens/Islands'
import { Practice } from './screens/Practice'
import { Listen } from './screens/Listen'
import { Read } from './screens/Read'
import { Write } from './screens/Write'
import { Progress } from './screens/Progress'
import { Insights } from './screens/Insights'
import { Grammar } from './screens/Grammar'
import { Auth } from './screens/Auth'
import { useAuth } from './lib/auth/useAuth'
import { useProgress, UserProgress } from './lib/data/progress'

// Where a signed-in user lands when they open the app:
//   never onboarded → Onboarding (→ the Day One sprint)
//   otherwise       → Home (which leads with resume-sprint or the daily plan)
function landingScreen(progress: UserProgress): AppScreen {
  const seen = progress.onboarded || Boolean(progress.sprint)
  if (!seen) return 'onboarding'
  return 'home'
}

// Screens worth restoring on a browser refresh (onboarding is never restored).
const SCREEN_KEY = 'ps_screen'
const RESTORABLE: AppScreen[] = ['home', 'learn', 'daily', 'islands', 'practice', 'progress', 'dayone', 'listen', 'read', 'write', 'insights', 'grammar']

export default function App() {
  const { user, loading } = useAuth()
  const { progress, ready } = useProgress()
  const [screen, setScreen] = useState<AppScreen | null>(null)

  // Navigate + remember the screen, so a browser refresh returns here instead
  // of bouncing back to Home.
  const go = (s: AppScreen) => {
    setScreen(s)
    try { localStorage.setItem(SCREEN_KEY, s) } catch { /* storage unavailable */ }
  }

  // Pick the landing screen once, after progress resolves: restore the last
  // screen if there is one, otherwise route by progress.
  useEffect(() => {
    if (!(user && ready && screen === null)) return
    const seen = progress.onboarded || Boolean(progress.sprint)
    let saved: string | null = null
    try { saved = localStorage.getItem(SCREEN_KEY) } catch { /* ignore */ }
    if (seen && saved && RESTORABLE.includes(saved as AppScreen)) setScreen(saved as AppScreen)
    else setScreen(landingScreen(progress))
  }, [user, ready, screen, progress])

  // Reset the landing decision on sign-out so the next user routes fresh.
  useEffect(() => {
    if (!user && screen !== null) {
      setScreen(null)
      try { localStorage.removeItem(SCREEN_KEY) } catch { /* ignore */ }
    }
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

  // Each hub screen renders its own bottom tab bar (drills and sub-flows
  // hide it, per the design: modal tasks get a close/back button instead).
  const screens: Record<AppScreen, React.ReactNode> = {
    onboarding: <Onboarding go={go} />,
    home:       <Home go={go} />,
    dayone:     <DayOne go={go} />,
    learn:      <Learn go={go} />,
    daily:      <Daily go={go} />,
    islands:    <Islands go={go} />,
    practice:   <Practice go={go} />,
    listen:     <Listen go={go} />,
    read:       <Read go={go} />,
    write:      <Write go={go} />,
    progress:   <Progress go={go} />,
    insights:   <Insights go={go} />,
    grammar:    <Grammar go={go} />,
  }

  return <div className="ps-app-frame">{screens[screen]}</div>
}
