import { CRUSTS, EXTRA_CHEESE_PRICE, EXTRA_TOPPING_PRICE, PRODUCT_BY_ID, PRODUCTS, type CrustId, type SizeId, type Topping } from '../data/menu'

export interface CartItem {
  key: string
  productId: string
  qty: number
  size?: SizeId
  crust?: CrustId
  extras?: Topping[]
  extraCheese?: boolean
}

export type Fulfilment = 'delivery' | 'pickup'

export const DELIVERY_FEE = 250
export const FREE_DELIVERY_FROM = 4000
export const MIN_DELIVERY_ORDER = 1500

const CHEAPEST_MEDIUM = Math.min(...PRODUCTS.flatMap((p) => (p.category === 'pizza' ? [p.prices.medium] : [])))

const rs = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
export const lkr = (n: number) => `Rs ${rs.format(Math.round(n))}`

/** Base price of the pizza or item before crust, toppings and cheese. */
function basePrice(item: CartItem): number {
  const p = PRODUCT_BY_ID[item.productId]
  if (!p) return 0
  return p.category === 'pizza' ? p.prices[item.size ?? 'medium'] : p.price
}

export function unitPrice(item: CartItem): number {
  const p = PRODUCT_BY_ID[item.productId]
  if (!p) return 0
  if (p.category !== 'pizza') return p.price
  const size = item.size ?? 'medium'
  const crust = CRUSTS.find((c) => c.id === (item.crust ?? 'hand'))!
  return p.prices[size] + crust.extra[size] + (item.extras?.length ?? 0) * EXTRA_TOPPING_PRICE[size] + (item.extraCheese ? EXTRA_CHEESE_PRICE[size] : 0)
}

export const lineTotal = (item: CartItem) => unitPrice(item) * item.qty

export interface Deal {
  code: string
  title: string
  summary: string
  terms: string[]
}

export const DEALS: Deal[] = [
  {
    code: 'DUO',
    title: '2 Medium pizzas for Rs 3,990',
    summary: 'Any two medium pizzas, any crust.',
    terms: ['Delivery & pickup', 'Crust upgrades and extra toppings charged as normal', 'Applies to the 2 priciest mediums'],
  },
  {
    code: 'BIG20',
    title: '20% off Large pizzas',
    summary: 'On orders of Rs 5,000 or more.',
    terms: ['Delivery & pickup', 'Discount on every Large pizza in the order', 'Minimum order Rs 5,000'],
  },
  {
    code: 'SWEET',
    title: 'Free Chocolate Fudge Cake',
    summary: 'With orders of Rs 4,500 or more.',
    terms: ['Add a Fudge Cake to your cart', 'One free cake per order', 'Minimum order Rs 4,500'],
  },
  {
    code: 'PICKUP15',
    title: '15% off pizzas on pickup',
    summary: 'Collect from your store and save.',
    terms: ['Pickup orders only', 'Applies to pizzas, not sides or drinks', 'No minimum order'],
  },
]

export interface DealResult {
  deal: Deal
  saving: number
  /** When not eligible: a specific, actionable reason. */
  reason?: string
  /** When the cart is close to unlocking it: what the deal would save once unlocked. */
  potential?: number
}

function evaluate(code: string, cart: CartItem[], subtotal: number, fulfilment: Fulfilment): DealResult | null {
  const deal = DEALS.find((d) => d.code === code)
  if (!deal) return null
  const pizzas = cart.filter((i) => PRODUCT_BY_ID[i.productId]?.category === 'pizza')

  switch (code) {
    case 'DUO': {
      const mediums = pizzas
        .filter((i) => i.size === 'medium')
        .flatMap((i) => Array.from({ length: i.qty }, () => basePrice(i)))
        .sort((a, b) => b - a)
      if (mediums.length < 2) {
        const need = 2 - mediums.length
        const potential = need === 1 ? Math.max(0, mediums[0] + CHEAPEST_MEDIUM - 3990) : undefined
        return { deal, saving: 0, potential, reason: `Add ${need} more Medium pizza${need > 1 ? 's' : ''} to unlock this deal.` }
      }
      return { deal, saving: Math.max(0, mediums[0] + mediums[1] - 3990) }
    }
    case 'BIG20': {
      const large = pizzas.filter((i) => i.size === 'large')
      if (large.length === 0) return { deal, saving: 0, reason: 'Add a Large pizza to use this deal.' }
      const saving = Math.round(large.reduce((s, i) => s + lineTotal(i), 0) * 0.2)
      if (subtotal < 5000) return { deal, saving: 0, potential: saving, reason: `Add ${lkr(5000 - subtotal)} more to unlock 20% off Large pizzas.` }
      return { deal, saving }
    }
    case 'SWEET': {
      const hasCake = cart.some((i) => i.productId === 'fudge-cake')
      const cake = unitPrice({ key: '', productId: 'fudge-cake', qty: 1 })
      if (subtotal < 4500)
        return {
          deal,
          saving: 0,
          potential: subtotal >= 3000 ? cake : undefined,
          reason: `Add ${lkr(4500 - subtotal)} more to get a free Chocolate Fudge Cake.`,
        }
      if (!hasCake) return { deal, saving: 0, potential: cake, reason: 'Add a Chocolate Fudge Cake. It’s on us with this order.' }
      return { deal, saving: cake }
    }
    case 'PICKUP15': {
      if (fulfilment !== 'pickup') return { deal, saving: 0, reason: 'Switch to Pickup to use this deal.' }
      if (pizzas.length === 0) return { deal, saving: 0, reason: 'Add a pizza to use this deal.' }
      return { deal, saving: Math.round(pizzas.reduce((s, i) => s + lineTotal(i), 0) * 0.15) }
    }
  }
  return null
}

export type CouponCheck = { ok: true; result: DealResult } | { ok: false; message: string }

export function checkCoupon(raw: string, cart: CartItem[], fulfilment: Fulfilment): CouponCheck {
  const code = raw.trim().toUpperCase()
  if (!code) return { ok: false, message: 'Enter a code first.' }
  const subtotal = cart.reduce((s, i) => s + lineTotal(i), 0)
  const r = evaluate(code, cart, subtotal, fulfilment)
  if (!r) return { ok: false, message: `We couldn’t find “${code}”. Try one of the deals listed above.` }
  if (r.reason) return { ok: false, message: r.reason }
  return { ok: true, result: r }
}

export interface Totals {
  subtotal: number
  applied: DealResult | null
  /** The closest deal the customer could still unlock, with how to unlock it. */
  nudge: DealResult | null
  deliveryFee: number
  total: number
  itemCount: number
}

export function computeTotals(cart: CartItem[], fulfilment: Fulfilment, coupon: string | null): Totals {
  const subtotal = cart.reduce((s, i) => s + lineTotal(i), 0)
  const itemCount = cart.reduce((s, i) => s + i.qty, 0)
  const results = DEALS.map((d) => evaluate(d.code, cart, subtotal, fulfilment)!).filter(Boolean)

  let applied: DealResult | null = null
  if (coupon) {
    const forced = results.find((r) => r.deal.code === coupon)
    if (forced && !forced.reason && forced.saving > 0) applied = forced
  }
  if (!applied) {
    applied = results.filter((r) => !r.reason && r.saving > 0).sort((a, b) => b.saving - a.saving)[0] ?? null
  }

  // Only one deal applies, so only suggest one that would beat the current saving.
  const nudge = results.find((r) => (r.potential ?? 0) > (applied?.saving ?? 0)) ?? null

  const saving = applied?.saving ?? 0
  const afterDeal = subtotal - saving
  const deliveryFee = fulfilment === 'delivery' && cart.length > 0 && afterDeal < FREE_DELIVERY_FROM ? DELIVERY_FEE : 0
  return { subtotal, applied, nudge, deliveryFee, total: afterDeal + deliveryFee, itemCount }
}

export function describeItem(item: CartItem): string {
  const p = PRODUCT_BY_ID[item.productId]
  if (!p) return ''
  if (p.category !== 'pizza') return p.unit
  const crust = CRUSTS.find((c) => c.id === (item.crust ?? 'hand'))!.label
  const size = item.size ? item.size[0].toUpperCase() + item.size.slice(1) : 'Medium'
  const parts = [size, crust]
  if (item.extras?.length) parts.push(`+${item.extras.length} topping${item.extras.length > 1 ? 's' : ''}`)
  if (item.extraCheese) parts.push('Extra cheese')
  return parts.join(' · ')
}
