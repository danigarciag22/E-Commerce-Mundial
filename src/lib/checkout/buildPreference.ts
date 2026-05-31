import type { CartItem } from '@/lib/cart/types'

export type PreferenceInput = { items: CartItem[]; email: string; siteUrl: string; shipping?: number }

export type PreferenceBody = {
  items: { id: string; title: string; quantity: number; unit_price: number; currency_id: 'COP' }[]
  payer: { email: string }
  back_urls: { success: string; failure: string; pending: string }
  notification_url: string
  auto_return: 'approved'
}

export function buildPreference({ items, email, siteUrl, shipping = 0 }: PreferenceInput): PreferenceBody {
  if (items.length === 0) throw new Error('Cannot build a preference for an empty cart')
  const base = siteUrl.replace(/\/$/, '')
  const lineItems: PreferenceBody['items'] = items.map((i) => ({
    id: i.id, title: i.name, quantity: i.quantity, unit_price: i.price, currency_id: 'COP',
  }))
  // Charge shipping as its own line so the MP total matches the summary.
  if (shipping > 0) {
    lineItems.push({ id: 'shipping', title: 'Envío', quantity: 1, unit_price: shipping, currency_id: 'COP' })
  }
  return {
    items: lineItems,
    payer: { email },
    back_urls: {
      success: `${base}/checkout/success`,
      failure: `${base}/checkout/failure`,
      pending: `${base}/checkout/pending`,
    },
    notification_url: `${base}/api/webhooks/mercadopago`,
    auto_return: 'approved',
  }
}
