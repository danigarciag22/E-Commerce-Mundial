import { describe, it, expect } from 'vitest'
import { buildPreference } from '@/lib/checkout/buildPreference'
import type { CartItem } from '@/lib/cart/types'

const items: CartItem[] = [
  { id: 'p1', name: 'Balón', price: 100, category: 'balon', quantity: 2 },
  { id: 'p2', name: 'Gorra', price: 50, category: 'merchandising', quantity: 1 },
]

describe('buildPreference', () => {
  it('maps cart items to MP preference items in COP', () => {
    const pref = buildPreference({ items, email: 'a@b.com', siteUrl: 'https://shop.test' })
    expect(pref.items).toEqual([
      { id: 'p1', title: 'Balón', quantity: 2, unit_price: 100, currency_id: 'COP' },
      { id: 'p2', title: 'Gorra', quantity: 1, unit_price: 50, currency_id: 'COP' },
    ])
  })
  it('sets payer email, back_urls and notification_url from siteUrl', () => {
    const pref = buildPreference({ items, email: 'a@b.com', siteUrl: 'https://shop.test' })
    expect(pref.payer).toEqual({ email: 'a@b.com' })
    expect(pref.back_urls).toEqual({
      success: 'https://shop.test/checkout/success',
      failure: 'https://shop.test/checkout/failure',
      pending: 'https://shop.test/checkout/pending',
    })
    expect(pref.notification_url).toBe('https://shop.test/api/webhooks/mercadopago')
    expect(pref.auto_return).toBe('approved')
  })
  it('throws on empty cart', () => {
    expect(() => buildPreference({ items: [], email: 'a@b.com', siteUrl: 'https://shop.test' })).toThrow(/empty/i)
  })
})
