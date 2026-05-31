import type { CartItem } from '@/lib/cart/types'

export function isDiscountUsable(d: { active: boolean; expires_at: string | null }, now: Date = new Date()): boolean {
  if (!d.active) return false
  if (d.expires_at && new Date(d.expires_at).getTime() <= now.getTime()) return false
  return true
}

export type DiscountApplication = {
  items: CartItem[]
  subtotal: number
  total: number
  discountAmount: number
}

export function applyDiscountToItems(items: CartItem[], percent: number): DiscountApplication {
  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0)
  if (!percent) {
    return { items, subtotal, total: subtotal, discountAmount: 0 }
  }
  const factor = 1 - percent / 100
  const discounted = items.map((i) => ({ ...i, price: Math.round(i.price * factor) }))
  const total = discounted.reduce((n, i) => n + i.price * i.quantity, 0)
  return { items: discounted, subtotal, total, discountAmount: subtotal - total }
}
