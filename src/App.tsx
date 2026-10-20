import { CartDrawer } from './components/CartDrawer'
import { Checkout } from './components/Checkout'
import { Footer, MobileCartBar, OfflineBanner, Toast } from './components/Chrome'
import { Customizer } from './components/Customizer'
import { Header } from './components/Header'
import { Home } from './components/Home'
import { LocationDialog } from './components/LocationDialog'
import { OrderTracking } from './components/OrderTracking'
import { useRoute } from './lib/router'
import { StoreProvider } from './state/store'
import { UiProvider } from './state/ui'

function Page() {
  const route = useRoute()
  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => (e.preventDefault(), document.getElementById('main')?.focus())}>
        Skip to content
      </a>
      <OfflineBanner />
      <Header compact={route.name !== 'home'} />
      {route.name === 'home' && (
        <main id="main" tabIndex={-1}>
          <Home />
        </main>
      )}
      {route.name === 'checkout' && <Checkout />}
      {route.name === 'order' && <OrderTracking id={route.id} />}
      <Footer />
      {route.name === 'home' && <MobileCartBar />}
      <CartDrawer />
      <Customizer />
      <LocationDialog />
      <Toast />
    </>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <UiProvider>
        <Page />
      </UiProvider>
    </StoreProvider>
  )
}
