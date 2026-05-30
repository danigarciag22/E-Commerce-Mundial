import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { buildPreference } from '@/lib/checkout/buildPreference'
import type { CartItem } from '@/lib/cart/types'

// Reads secrets at runtime and talks to Mercado Pago, so it must never be
// statically rendered at build time.
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let body: { items?: CartItem[]; email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const items = body.items ?? []
  const email = body.email ?? ''
  if (items.length === 0) {
    return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 })
  }
  if (!email) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!accessToken || !siteUrl) {
    return NextResponse.json({ error: 'Checkout no configurado' }, { status: 500 })
  }

  try {
    const client = new MercadoPagoConfig({ accessToken })
    const preference = new Preference(client)
    const result = await preference.create({
      body: buildPreference({ items, email, siteUrl }),
    })
    return NextResponse.json({ id: result.id, init_point: result.init_point })
  } catch (err) {
    console.error('MP preference error', err)
    return NextResponse.json({ error: 'No se pudo iniciar el pago' }, { status: 502 })
  }
}
