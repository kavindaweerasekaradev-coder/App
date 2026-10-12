import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useApp } from '@/state/AppState'
import { AppShell } from '@/components/layout/AppShell'
import { Onboarding } from '@/screens/onboarding/Onboarding'
import { Home } from '@/screens/Home'
import { Explore } from '@/screens/Explore'
import { StationDetails } from '@/screens/StationDetails'
import { Profile } from '@/screens/Profile'
import { NotFound } from '@/screens/NotFound'
import { Skeleton } from '@/components/ui/primitives'

// Chart-heavy screens load on demand to keep the first load small.
const Journey = lazy(() => import('@/screens/Journey').then((m) => ({ default: m.Journey })))
const ChargingSessionScreen = lazy(() => import('@/screens/ChargingSession').then((m) => ({ default: m.ChargingSessionScreen })))
const Insights = lazy(() => import('@/screens/Insights').then((m) => ({ default: m.Insights })))

function ScreenFallback() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 pt-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="h-40 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

export function App() {
  const { onboarded } = useApp()
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <ScrollToTop />
      <Routes>
        <Route path="/welcome" element={onboarded ? <Navigate to="/" replace /> : <Onboarding />} />
        <Route element={onboarded ? <AppShell /> : <Navigate to="/welcome" replace />}>
          <Route index element={<Home />} />
          <Route path="explore" element={<Explore />} />
          <Route path="stations/:id" element={<StationDetails />} />
          <Route
            path="journey"
            element={
              <Suspense fallback={<ScreenFallback />}>
                <Journey />
              </Suspense>
            }
          />
          <Route
            path="charging"
            element={
              <Suspense fallback={<ScreenFallback />}>
                <ChargingSessionScreen />
              </Suspense>
            }
          />
          <Route
            path="insights"
            element={
              <Suspense fallback={<ScreenFallback />}>
                <Insights />
              </Suspense>
            }
          />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}
