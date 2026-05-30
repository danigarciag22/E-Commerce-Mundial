'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/lib/cart/cartStore'

export function CartButton() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0))

  const showCount = mounted && count > 0

  return (
    <Link
      href="/carrito"
      className="relative inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={showCount ? `Carrito, ${count} artículos` : 'Carrito'}
    >
      <ShoppingBag className="size-4" aria-hidden />
      <span>Carrito</span>
      {showCount && (
        <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-bold tabular-nums text-primary-foreground">
          {count}
        </span>
      )}
    </Link>
  )
}
