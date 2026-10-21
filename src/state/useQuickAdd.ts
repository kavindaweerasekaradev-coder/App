import { PRODUCT_BY_ID, type SizeId } from '../data/menu'
import { flyToCart } from '../lib/fly'
import { newKey } from '../lib/id'
import { describeItem, type CartItem } from '../lib/pricing'
import { useStore } from './store'
import { useUi } from './ui'

interface Options {
  /** For pizzas: the size to add, with the default crust and no extras. */
  size?: SizeId
  /** Element to fly into the cart (usually the product photo). */
  from?: HTMLElement | null
}

/** Adds an item straight to the cart, with undo. */
export function useQuickAdd() {
  const { state, dispatch } = useStore()
  const { showToast, setCartOpen } = useUi()
  return (productId: string, { size, from }: Options = {}) => {
    const before = state.cart
    const product = PRODUCT_BY_ID[productId]
    const item: CartItem =
      product.category === 'pizza'
        ? { key: newKey(), productId, qty: 1, size: size ?? 'medium', crust: 'hand', extras: [], extraCheese: false }
        : { key: newKey(), productId, qty: 1 }
    dispatch({ type: 'addItem', item })
    if (from) flyToCart(from)
    showToast({
      text: product.category === 'pizza' ? `${product.name} (${describeItem(item)}) added` : `${product.name} added to cart`,
      action: { label: 'View cart', onClick: () => setCartOpen(true) },
      secondary: { label: 'Undo', onClick: () => dispatch({ type: 'restoreCart', cart: before }) },
    })
  }
}
