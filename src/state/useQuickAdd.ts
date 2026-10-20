import { PRODUCT_BY_ID } from '../data/menu'
import { newKey } from '../lib/id'
import type { CartItem } from '../lib/pricing'
import { useStore } from './store'
import { useUi } from './ui'

/** Adds a non-pizza item straight to the cart, with undo. */
export function useQuickAdd() {
  const { state, dispatch } = useStore()
  const { showToast, setCartOpen } = useUi()
  return (productId: string) => {
    const before = state.cart
    const item: CartItem = { key: newKey(), productId, qty: 1 }
    dispatch({ type: 'addItem', item })
    showToast({
      text: `${PRODUCT_BY_ID[productId].name} added to cart`,
      action: { label: 'View cart', onClick: () => setCartOpen(true) },
      secondary: { label: 'Undo', onClick: () => dispatch({ type: 'restoreCart', cart: before }) },
    })
  }
}
