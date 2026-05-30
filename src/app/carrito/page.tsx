'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useCartStore } from '@/lib/cart/cartStore'
import { CartItemRow } from '@/components/cart/CartItemRow'

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export default function CartPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.price * i.quantity, 0),
  )

  if (!mounted) {
    return <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8" />
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Seguir comprando
      </Link>

      <h1 className="mb-6 mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
        Tu carrito
      </h1>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center">
          <p className="text-muted-foreground">Tu carrito está vacío.</p>
          <Link
            href="/"
            className="mt-4 inline-block font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Ver productos
          </Link>
        </div>
      ) : (
        <>
          <ul>
            {items.map((item) => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between">
            <span className="text-lg font-medium">Total</span>
            <span className="text-2xl font-bold tabular-nums">{cop.format(total)}</span>
          </div>
          <Link
            href="/checkout"
            className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Proceder al pago
          </Link>
        </>
      )}
    </main>
  )
}
