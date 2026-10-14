import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { formatMoney, type MoneyOptions } from '../lib/format'
import { useFinance } from './store'

interface Display {
  hidden: boolean
  toggleHidden: () => void
  /** Format a USD amount in the chosen currency, masked while privacy mode is on. */
  money: (usd: number, opts?: MoneyOptions) => string
}

const DisplayContext = createContext<Display | null>(null)

export function DisplayProvider({ children }: { children: ReactNode }) {
  const { state } = useFinance()
  const [hidden, setHidden] = useState(false)
  const toggleHidden = useCallback(() => setHidden((h) => !h), [])
  const money = useCallback(
    (usd: number, opts?: MoneyOptions) => (hidden ? '••••' : formatMoney(usd, state.currency, opts)),
    [hidden, state.currency],
  )
  const value = useMemo(() => ({ hidden, toggleHidden, money }), [hidden, toggleHidden, money])
  return <DisplayContext.Provider value={value}>{children}</DisplayContext.Provider>
}

export function useDisplay(): Display {
  const ctx = useContext(DisplayContext)
  if (!ctx) throw new Error('useDisplay must be used inside <DisplayProvider>')
  return ctx
}
