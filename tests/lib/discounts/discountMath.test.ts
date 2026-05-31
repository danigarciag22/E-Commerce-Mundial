import { describe, it, expect } from 'vitest'
import { isDiscountUsable, applyDiscountToItems } from '@/lib/discounts/discountMath'
import type { CartItem } from '@/lib/cart/types'

const items: CartItem[] = [
  { id: 'p1', name: 'Balón', price: 100000, category: 'balon', quantity: 2 },
  { id: 'p2', name: 'Gorra', price: 50000, category: 'merchandising', quantity: 1 },
]

describe('isDiscountUsable', () => {
  const now = new Date('2026-06-01T00:00:00Z')
  it('usable when active and no expiry', () => {
    expect(isDiscountUsable({ active: true, expires_at: null }, now)).toBe(true)
  })
  it('usable when active and expiry in the future', () => {
    expect(isDiscountUsable({ active: true, expires_at: '2026-12-01T00:00:00Z' }, now)).toBe(true)
  })
  it('not usable when inactive', () => {
    expect(isDiscountUsable({ active: false, expires_at: null }, now)).toBe(false)
  })
  it('not usable when expired', () => {
    expect(isDiscountUsable({ active: true, expires_at: '2026-01-01T00:00:00Z' }, now)).toBe(false)
  })
})

describe('applyDiscountToItems', () => {
  it('reduces each unit price by percent (rounded) and reports totals', () => {
    const r = applyDiscountToItems(items, 10)
    expect(r.items[0].price).toBe(90000)
    expect(r.items[1].price).toBe(45000)
    expect(r.subtotal).toBe(250000)        // 100000*2 + 50000
    expect(r.total).toBe(225000)           // 90000*2 + 45000
    expect(r.discountAmount).toBe(25000)
  })
  it('returns originals for percent 0', () => {
    const r = applyDiscountToItems(items, 0)
    expect(r.items).toEqual(items)
    expect(r.discountAmount).toBe(0)
  })
})
