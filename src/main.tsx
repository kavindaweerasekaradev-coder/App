import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, MemoryRouter } from 'react-router-dom'
import '@fontsource-variable/manrope'
import './index.css'
import { AppStateProvider } from '@/state/AppState'
import { App } from './App'

// Hosted previews that can't use URL hashes build with VITE_ROUTER=memory.
const Router = import.meta.env.VITE_ROUTER === 'memory' ? MemoryRouter : HashRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <AppStateProvider>
        <App />
      </AppStateProvider>
    </Router>
  </StrictMode>,
)
