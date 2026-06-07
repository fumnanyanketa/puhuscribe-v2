import React, { useState } from 'react'
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

const APP_SCREENS: AppScreen[] = ['daily', 'island', 'progress']

export default function App() {
  const { user, loading } = useAuth()
  const [screen, setScreen] = useState<AppScreen>('onboarding')
  const go = (s: AppScreen) => setScreen(s)

  // Auth gate: resolve the session first, then require sign-in.
  if (loading) {
    return <div className="ps-app-frame"><StatePane title="Ladataan…" /></div>
  }
  if (!user) {
    return <div className="ps-app-frame"><Auth /></div>
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
