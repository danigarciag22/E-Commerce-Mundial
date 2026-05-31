'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, PartyPopper, Plus, ShoppingBag, Sparkles, X } from 'lucide-react'
import { useCartStore } from '@/lib/cart/cartStore'
import { placeholderImage } from '@/lib/products/placeholderImage'
import {
  amountToNext,
  nextTier,
  progressToNext,
  subtotalOf,
  unlockedTier,
} from '@/lib/cart/promos'
import { cn } from '@/lib/utils'

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const AUTO_DISMISS_MS = 9000

export function CartPromoPopup() {
  const items = useCartStore((s) => s.items)
  const lastAddedId = useCartStore((s) => s.lastAddedId)
  const lastAddedAt = useCartStore((s) => s.lastAddedAt)
  const setQuantity = useCartStore((s) => s.setQuantity)

  const [open, setOpen] = useState(false)
  const seenAt = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }
  const startTimer = () => {
    clearTimer()
    timer.current = setTimeout(() => setOpen(false), AUTO_DISMISS_MS)
  }

  // Open whenever a NEW add happens (lastAddedAt advances).
  useEffect(() => {
    if (lastAddedAt && lastAddedAt !== seenAt.current) {
      seenAt.current = lastAddedAt
      setOpen(true)
      startTimer()
    }
    return clearTimer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAddedAt])

  const lastItem = items.find((i) => i.id === lastAddedId) ?? null

  // Nothing to show until the trigger has fired for a real item.
  if (!open || !lastItem) return null

  const subtotal = subtotalOf(items)
  const unlocked = unlockedTier(subtotal)
  const next = nextTier(subtotal)
  const remaining = amountToNext(subtotal)
  const progress = progressToNext(subtotal)

  // Would adding one more of the just-added item cross into the next tier?
  const oneMoreCrosses = next ? subtotal + lastItem.price >= next.minSubtotal : false

  const close = () => {
    clearTimer()
    setOpen(false)
  }

  const addOneMore = () => {
    setQuantity(lastItem.id, lastItem.quantity + 1)
    startTimer()
  }

  return (
    <div
      role="dialog"
      aria-label="Producto agregado al carrito"
      onMouseEnter={clearTimer}
      onMouseLeave={startTimer}
      className={cn(
        'fixed inset-x-4 bottom-4 z-50 sm:inset-x-auto sm:right-4 sm:bottom-auto sm:top-20 sm:w-[380px]',
        'rounded-2xl border border-border bg-card text-card-foreground shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]',
        'animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-top-4 duration-300',
      )}
    >
      <div className="flex items-start gap-3 border-b border-border p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-500">
          <Check className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Agregado al carrito</p>
          <p className="truncate text-sm text-muted-foreground">
            {lastItem.name} · {lastItem.quantity}{' '}
            {lastItem.quantity === 1 ? 'unidad' : 'unidades'}
          </p>
        </div>
        <div
          aria-hidden
          className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-gradient-to-br from-muted via-card to-muted/40"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={placeholderImage(lastItem.category)}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      {/* Reward / progress */}
      <div className="flex flex-col gap-3 p-4">
        {unlocked ? (
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-500">
            <PartyPopper className="size-4 shrink-0" aria-hidden />
            ¡Desbloqueaste {unlocked.label}!
          </p>
        ) : (
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Sparkles className="size-4 shrink-0 text-amber-500" aria-hidden />
            Sumá productos y ahorrá
          </p>
        )}

        {next ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-sm text-muted-foreground">
              Te faltan{' '}
              <span className="font-semibold tabular-nums text-amber-600 dark:text-amber-500">
                {cop.format(remaining)}
              </span>{' '}
              para <span className="font-semibold text-foreground">{next.label}</span>
            </p>
            <span className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-amber-400 transition-[width] duration-500"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Tienes el <span className="font-semibold text-foreground">máximo descuento</span>.
            Se aplicará automáticamente al pagar.
          </p>
        )}

        {unlocked && (
          <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            Código{' '}
            <span className="font-mono font-semibold text-foreground">{unlocked.code}</span>{' '}
            se aplicará automáticamente en el pago.
          </p>
        )}

        {/* Quantity bump — adding one more crosses into the next reward */}
        {next && oneMoreCrosses && (
          <button
            type="button"
            onClick={addOneMore}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-amber-400/60 bg-amber-400/10 px-4 text-sm font-semibold text-amber-700 transition hover:bg-amber-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:text-amber-400"
          >
            <Plus className="size-4" aria-hidden />
            Agrega 1 más y desbloquea {next.label}
          </button>
        )}

        <div className="mt-1 flex gap-2">
          <Link
            href="/carrito"
            onClick={close}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-background text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ShoppingBag className="size-4" aria-hidden />
            Ver carrito
          </Link>
          <Link
            href="/checkout"
            onClick={close}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Ir a pagar
          </Link>
        </div>
      </div>
    </div>
  )
}
