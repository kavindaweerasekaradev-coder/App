import { describe, expect, it } from 'vitest'
import { checkCoupon, computeTotals, unitPrice, type CartItem } from './pricing'
import { normalisePhone } from './phone'

const pizza = (productId: string, size: CartItem['size'], extra: Partial<CartItem> = {}): CartItem => ({
  key: productId + size,
  productId,
  size,
  crust: 'hand',
  qty: 1,
  ...extra,
})

describe('unitPrice', () => {
  it('adds crust, toppings and cheese for the chosen size', () => {
    // Large Devilled Chicken 3,690 + Cheese Burst 850 + 1 topping 300 + cheese 400
    expect(unitPrice(pizza('devilled-chicken', 'large', { crust: 'burst', extras: ['mushroom'], extraCheese: true }))).toBe(5240)
  })
})

describe('computeTotals', () => {
  it('applies the 2 Medium deal automatically', () => {
    const t = computeTotals([pizza('pepperoni-classic', 'medium'), pizza('margherita', 'medium')], 'delivery', null)
    expect(t.applied?.deal.code).toBe('DUO')
    expect(t.applied?.saving).toBe(2290 + 1890 - 3990)
  })

  it('picks the deal that saves most', () => {
    const cart = [
      pizza('devilled-chicken', 'large', { crust: 'burst', extras: ['mushroom'] }),
      pizza('pepperoni-classic', 'medium'),
      pizza('margherita', 'medium'),
    ]
    const t = computeTotals(cart, 'delivery', null)
    expect(t.applied?.deal.code).toBe('BIG20')
    expect(t.applied?.saving).toBe(968)
  })

  it('does not suggest a deal that would save less than the current one', () => {
    const cart = [
      pizza('devilled-chicken', 'large', { crust: 'burst', extras: ['mushroom'] }),
      pizza('pepperoni-classic', 'medium'),
      pizza('margherita', 'medium'),
    ]
    expect(computeTotals(cart, 'delivery', null).nudge).toBeNull()
  })

  it('charges delivery below the free threshold and never for pickup', () => {
    const cart = [pizza('margherita', 'medium')]
    expect(computeTotals(cart, 'delivery', null).deliveryFee).toBe(250)
    expect(computeTotals(cart, 'pickup', null).deliveryFee).toBe(0)
  })
})

describe('checkCoupon', () => {
  it('explains exactly what is missing', () => {
    const r = checkCoupon('duo', [pizza('margherita', 'medium')], 'delivery')
    expect(r).toEqual({ ok: false, message: 'Add 1 more Medium pizza to unlock this deal.' })
  })

  it('rejects unknown codes', () => {
    expect(checkCoupon('free', [], 'delivery').ok).toBe(false)
  })
})

describe('normalisePhone', () => {
  it.each(['0771234567', '77 123 4567', '+94 77 123 4567', '94771234567'])('accepts %s', (raw) => {
    expect(normalisePhone(raw)).toBe('771234567')
  })
  it('rejects short numbers', () => {
    expect(normalisePhone('077123')).toBeNull()
  })
})
