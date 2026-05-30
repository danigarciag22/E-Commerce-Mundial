'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useCartStore } from '@/lib/cart/cartStore'
import { cn } from '@/lib/utils'

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export default function CheckoutPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.price * i.quantity, 0),
  )

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al iniciar el pago')
      window.location.href = data.init_point
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al iniciar el pago')
      setLoading(false)
    }
  }

  if (!mounted) {
    return <main className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6 lg:px-8" />
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">Pagar</h1>
        <p className="text-muted-foreground">Tu carrito está vacío.</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Seguir comprando
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/carrito"
        className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver al carrito
      </Link>

      <h1 className="mb-6 mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
        Pagar
      </h1>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <label className="block text-sm font-medium" htmlFor="email">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <span className="font-medium">Total</span>
          <span className="text-xl font-bold tabular-nums">{cop.format(total)}</span>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-3 text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={loading || !email}
          onClick={handlePay}
          className={cn(
            'mt-6 flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition',
            'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {loading ? 'Redirigiendo…' : 'Pagar con Mercado Pago'}
        </button>
      </div>
    </main>
  )
}
