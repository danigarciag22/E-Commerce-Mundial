'use client'

import { Minus, Plus } from 'lucide-react'
import { useCartStore } from '@/lib/cart/cartStore'
import { placeholderImage } from '@/lib/products/placeholderImage'
import type { CartItem } from '@/lib/cart/types'

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function CartItemRow({ item }: { item: CartItem }) {
  const setQuantity = useCartStore((s) => s.setQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  return (
    <li className="flex items-center gap-4 border-b border-border py-4">
      <div
        aria-hidden
        className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-gradient-to-br from-muted via-card to-muted/40"
      >
        {/* Generic placeholder — Higgsfield render in Fase 2 (see docs/3D-ASSETS.md) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={placeholderImage(item.category)} alt="" className="absolute inset-0 size-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.name}</p>
        <p className="text-sm text-muted-foreground tabular-nums">{cop.format(item.price)}</p>
      </div>
      <div
        className="flex items-center gap-1.5"
        role="group"
        aria-label={`Cantidad de ${item.name}`}
      >
        <button
          type="button"
          onClick={() => setQuantity(item.id, item.quantity - 1)}
          className="grid size-8 place-items-center rounded-md border border-border transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Disminuir"
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <span className="w-6 text-center tabular-nums">{item.quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity(item.id, item.quantity + 1)}
          className="grid size-8 place-items-center rounded-md border border-border transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Aumentar"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
      <p className="w-24 text-right font-semibold tabular-nums">
        {cop.format(item.price * item.quantity)}
      </p>
      <button
        type="button"
        onClick={() => removeItem(item.id)}
        className="rounded text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Quitar
      </button>
    </li>
  )
}
