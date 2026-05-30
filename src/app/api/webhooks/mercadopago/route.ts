import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { verifyWebhookSignature } from '@/lib/checkout/verifyWebhookSignature'
import { createOrder } from '@/lib/orders/createOrder'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CartItem } from '@/lib/cart/types'

// Reads secrets and calls Mercado Pago / Supabase at request time, so it must
// never be statically rendered at build time.
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const url = new URL(request.url)
  const dataId = url.searchParams.get('data.id') ?? url.searchParams.get('id')

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!secret || !accessToken) {
    return NextResponse.json({ error: 'not configured' }, { status: 500 })
  }

  const valid = verifyWebhookSignature({
    xSignature: request.headers.get('x-signature'),
    xRequestId: request.headers.get('x-request-id'),
    dataId,
    secret,
  })
  if (!valid) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  // Only payment notifications carry an order to record.
  if (!dataId) return NextResponse.json({ received: true })

  try {
    const client = new MercadoPagoConfig({ accessToken })
    const payment = await new Payment(client).get({ id: dataId })

    if (payment.status === 'approved') {
      const items = (payment.additional_info?.items ?? []).map(
        (i): CartItem => ({
          id: String(i.id),
          name: i.title ?? '',
          price: Number(i.unit_price ?? 0),
          // MP doesn't round-trip our product category, so recorded items
          // default to 'merchandising'. Documented simplification — the
          // authoritative item identity is id + title + unit_price.
          category: 'merchandising',
          quantity: Number(i.quantity ?? 1),
        }),
      )
      const admin = createAdminClient()
      await createOrder(admin, {
        paymentIntentId: String(payment.id),
        total: Number(payment.transaction_amount ?? 0),
        items,
        status: 'paid',
      })
    }
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('MP webhook error', err)
    // 200 so MP stops retrying on our internal errors; we logged it.
    return NextResponse.json({ received: true })
  }
}
