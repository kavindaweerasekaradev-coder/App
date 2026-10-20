import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

export interface ToastMsg {
  id: number
  text: string
  action?: { label: string; onClick: () => void }
  secondary?: { label: string; onClick: () => void }
}

interface Ui {
  product: { id: string; editKey?: string } | null
  openProduct: (id: string, editKey?: string) => void
  closeProduct: () => void
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  locationOpen: boolean
  setLocationOpen: (open: boolean) => void
  toast: ToastMsg | null
  showToast: (t: Omit<ToastMsg, 'id'>) => void
  dismissToast: () => void
}

const UiContext = createContext<Ui | null>(null)

export function UiProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<Ui['product']>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const [toast, setToast] = useState<ToastMsg | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const dismissToast = useCallback(() => setToast(null), [])
  const showToast = useCallback((t: Omit<ToastMsg, 'id'>) => setToast({ ...t, id: Date.now() }), [])

  useEffect(() => {
    if (!toast) return
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), 6000)
    return () => window.clearTimeout(timer.current)
  }, [toast])

  return (
    <UiContext.Provider
      value={{
        product,
        openProduct: (id, editKey) => setProduct({ id, editKey }),
        closeProduct: () => setProduct(null),
        cartOpen,
        setCartOpen: (open) => {
          // Opening the cart answers any "added to cart" toast.
          if (open) setToast(null)
          setCartOpen(open)
        },
        locationOpen,
        setLocationOpen,
        toast,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </UiContext.Provider>
  )
}

// oxlint-disable-next-line react/only-export-components
export function useUi() {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi must be used inside UiProvider')
  return ctx
}
