import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import App from './App'
import { AuthProvider } from './lib/auth/useAuth'
import { LangProvider } from './lib/lang/useLang'
import { ProgressProvider } from './lib/data/progress'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <AuthProvider>
        <ProgressProvider>
          <App />
        </ProgressProvider>
      </AuthProvider>
    </LangProvider>
  </StrictMode>,
)
