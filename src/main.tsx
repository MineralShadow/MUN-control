import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { ConferenceProvider } from './state/ConferenceContext'
import { ToastProvider } from './components/Toast'
import { ConfirmProvider } from './components/ConfirmDialog'
import { NavigationGuardProvider } from './components/NavigationGuard'

const container = document.getElementById('root')
if (!container) throw new Error('找不到 #root 挂载点')

createRoot(container).render(
  <StrictMode>
    <ToastProvider>
      <ConfirmProvider>
        <ConferenceProvider>
          <NavigationGuardProvider>
            <App />
          </NavigationGuardProvider>
        </ConferenceProvider>
      </ConfirmProvider>
    </ToastProvider>
  </StrictMode>,
)
