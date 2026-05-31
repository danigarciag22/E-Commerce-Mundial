'use client'

import { startTransition, useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog } from '@base-ui/react/dialog'
import {
  ChevronDown,
  HeartCrack,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import { useCartStore } from '@/lib/cart/cartStore'
import { useWishlistStore } from '@/lib/wishlist/wishlistStore'
import { useHydrated } from '@/lib/hooks/useHydrated'
import { useAuth } from '@/components/auth/AuthContext'
import { useAuthModalStore } from '@/lib/auth/authModalStore'
import { placeholderImage } from '@/lib/products/placeholderImage'
import { checkDiscountAction } from '@/lib/discounts/checkDiscountAction'
import {
  FREE_SHIPPING_THRESHOLD,
  freeShippingProgress,
  freeShippingRemaining,
  subtotalOf,
} from '@/lib/cart/promos'
import type { Product, ProductCategory } from '@/lib/products/types'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const categoryLabel: Record<ProductCategory, string> = {
  uniforme: 'Uniforme',
  zapato: 'Botines',
  balon: 'Balón',
  merchandising: 'Merch',
}

type Tab = 'cart' | 'wishlist'

export function CartDrawer() {
  const hydrated = useHydrated()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const openAuthModal = useAuthModalStore((s) => s.openModal)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('cart')

  const items = useCartStore((s) => s.items)
  const setQuantity = useCartStore((s) => s.setQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const addItem = useCartStore((s) => s.addItem)
  const promoCode = useCartStore((s) => s.promoCode)
  const setPromoCode = useCartStore((s) => s.setPromoCode)

  const wishlist = useWishlistStore((s) => s.items)
  const wishlistRemove = useWishlistStore((s) => s.remove)

  const count = items.reduce((n, i) => n + i.quantity, 0)
  const subtotal = subtotalOf(items)
  const remaining = freeShippingRemaining(subtotal)
  const progress = freeShippingProgress(subtotal)

  // Cross-sell: a few active products loaded lazily when the drawer opens.
  const [related, setRelated] = useState<Product[]>([])
  useEffect(() => {
    if (!open || related.length > 0) return
    const supabase = createClient()
    supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .limit(8)
      .then(({ data }) => {
        if (data) {
          setRelated(
            data.map((r) => ({
              id: r.id,
              name: r.name,
              sku: r.sku,
              price: Number(r.price),
              description: r.description,
              category: r.category as ProductCategory,
              stock: Number(r.stock),
              active: r.active,
            })),
          )
        }
      })
  }, [open, related.length])

  const inCart = new Set(items.map((i) => i.id))
  const crossSell = related.filter((p) => !inCart.has(p.id)).slice(0, 4)

  // Discount code (carried into checkout; server re-validates there too).
  const [codeState, codeAction, codePending] = useActionState(checkDiscountAction, null)
  useEffect(() => {
    if (codeState?.ok) setPromoCode(codeState.code)
  }, [codeState, setPromoCode])
  const [discountOpen, setDiscountOpen] = useState(false)

  function applyCode(formData: FormData) {
    startTransition(() => codeAction(formData))
  }

  function goLogin() {
    setOpen(false)
    openAuthModal('/')
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className="relative inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={hydrated && count > 0 ? `Carrito, ${count} artículos` : 'Carrito'}
      >
        <ShoppingBag className="size-4" aria-hidden />
        <span>Carrito</span>
        {hydrated && count > 0 && (
          <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-bold tabular-nums text-primary-foreground">
            {count}
          </span>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-[440px] flex-col bg-card shadow-2xl outline-none transition-transform duration-300 ease-out data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full">
          {/* Header: tabs + close */}
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex rounded-full bg-muted p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => setTab('cart')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-colors',
                  tab === 'cart' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
                )}
              >
                <ShoppingBag className="size-3.5" aria-hidden />
                Mi Carrito
              </button>
              <button
                type="button"
                onClick={() => setTab('wishlist')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-colors',
                  tab === 'wishlist' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
                )}
              >
                <Heart className="size-3.5" aria-hidden />
                Deseos
              </button>
            </div>
            <Dialog.Title className="sr-only">
              {tab === 'cart' ? 'Mi carrito' : 'Lista de deseos'}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Cerrar"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-5" aria-hidden />
            </Dialog.Close>
          </div>

          {tab === 'cart' ? (
            <CartTab
              items={items}
              subtotal={subtotal}
              remaining={remaining}
              progress={progress}
              crossSell={crossSell}
              onQty={setQuantity}
              onRemove={removeItem}
              onAdd={(p) => addItem({ id: p.id, name: p.name, price: p.price, category: p.category })}
              discountOpen={discountOpen}
              setDiscountOpen={setDiscountOpen}
              applyCode={applyCode}
              codePending={codePending}
              codeState={codeState}
              promoCode={promoCode}
              onCheckout={() => {
                setOpen(false)
                router.push('/checkout')
              }}
            />
          ) : (
            <WishlistTab
              authed={isAuthenticated}
              items={wishlist}
              onLogin={goLogin}
              onExplore={() => setOpen(false)}
              addToCart={(w) => addItem(w)}
              removeFromWishlist={wishlistRemove}
            />
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

type CartTabProps = {
  items: ReturnType<typeof useCartStore.getState>['items']
  subtotal: number
  remaining: number
  progress: number
  crossSell: Product[]
  onQty: (id: string, q: number) => void
  onRemove: (id: string) => void
  onAdd: (p: Product) => void
  discountOpen: boolean
  setDiscountOpen: (v: boolean) => void
  applyCode: (fd: FormData) => void
  codePending: boolean
  codeState: { ok: true; code: string; percent: number } | { ok: false; error: string } | null
  promoCode: string | null
  onCheckout: () => void
}

function CartTab(props: CartTabProps) {
  const { items, subtotal, remaining, progress, crossSell, onQty, onRemove, onAdd } = props

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
          <ShoppingBag className="size-6" aria-hidden />
        </span>
        <p className="font-medium">Tu carrito está vacío</p>
        <p className="text-sm text-muted-foreground">Agrega productos para empezar.</p>
      </div>
    )
  }

  return (
    <>
      {/* Free-shipping progress */}
      <div className="border-b border-border px-5 py-4">
        {remaining > 0 ? (
          <p className="text-sm">
            Te faltan{' '}
            <span className="font-semibold tabular-nums">{cop.format(remaining)}</span> para{' '}
            <span className="font-semibold">envío gratis</span>
          </p>
        ) : (
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-500">
            🎉 ¡Tienes envío gratis!
          </p>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
          <span>{cop.format(0)}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </span>
          <span>{cop.format(FREE_SHIPPING_THRESHOLD)}</span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-muted via-card to-muted/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={placeholderImage(item.category)} alt="" className="absolute inset-0 size-full object-cover" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{categoryLabel[item.category]}</p>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <div className="inline-flex items-center rounded-full border border-border">
                    <button
                      type="button"
                      onClick={() => onQty(item.id, item.quantity - 1)}
                      aria-label="Disminuir"
                      className="grid size-7 place-items-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Minus className="size-3.5" aria-hidden />
                    </button>
                    <span className="w-7 text-center text-sm tabular-nums">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onQty(item.id, item.quantity + 1)}
                      aria-label="Aumentar"
                      className="grid size-7 place-items-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Plus className="size-3.5" aria-hidden />
                    </button>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {cop.format(item.price * item.quantity)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                aria-label={`Quitar ${item.name}`}
                className="self-start rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>

        {/* Cross-sell */}
        {crossSell.length > 0 && (
          <div className="mt-6 border-t border-border pt-5">
            <h3 className="text-sm font-semibold">Completa tu estilo</h3>
            <ul className="mt-3 grid grid-cols-2 gap-3">
              {crossSell.map((p) => (
                <li key={p.id} className="flex flex-col gap-1.5 rounded-xl border border-border p-2.5">
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gradient-to-br from-muted via-card to-muted/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={placeholderImage(p.category)} alt="" className="absolute inset-0 size-full object-cover" />
                  </div>
                  <p className="line-clamp-1 text-xs font-medium">{p.name}</p>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold tabular-nums">{cop.format(p.price)}</span>
                    <button
                      type="button"
                      onClick={() => onAdd(p)}
                      className="inline-flex items-center gap-0.5 rounded-full bg-primary px-2 py-1 text-[0.7rem] font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Plus className="size-3" aria-hidden />
                      Agregar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Discount accordion */}
        <div className="mt-6 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => props.setDiscountOpen(!props.discountOpen)}
            aria-expanded={props.discountOpen}
            className="flex w-full items-center justify-between rounded-md py-1 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="inline-flex items-center gap-2">
              <Tag className="size-4 text-muted-foreground" aria-hidden />
              ¿Tienes un código de descuento?
            </span>
            <ChevronDown className={cn('size-4 transition-transform', props.discountOpen && 'rotate-180')} aria-hidden />
          </button>
          {props.discountOpen && (
            <form action={props.applyCode} className="mt-3 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex gap-2">
                <input
                  name="code"
                  type="text"
                  placeholder="Ingresa tu código"
                  defaultValue={props.promoCode ?? ''}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm uppercase shadow-sm placeholder:normal-case focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="submit"
                  disabled={props.codePending}
                  className="shrink-0 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  {props.codePending ? '…' : 'Aplicar'}
                </button>
              </div>
              {props.codeState?.ok && (
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-500">
                  Código {props.codeState.code} (−{props.codeState.percent}%) aplicado
                </p>
              )}
              {props.codeState && !props.codeState.ok && (
                <p className="text-xs font-medium text-destructive">{props.codeState.error}</p>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-5 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-lg font-bold tabular-nums">{cop.format(subtotal)}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">Impuestos y envío se calculan al pagar.</p>
        <button
          type="button"
          onClick={props.onCheckout}
          className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Proceder al Pago
        </button>
      </div>
    </>
  )
}

type WishlistItem = ReturnType<typeof useWishlistStore.getState>['items'][number]

function WishlistTab({
  authed,
  items,
  onLogin,
  onExplore,
  addToCart,
  removeFromWishlist,
}: {
  authed: boolean
  items: WishlistItem[]
  onLogin: () => void
  onExplore: () => void
  addToCart: (w: WishlistItem) => void
  removeFromWishlist: (id: string) => void
}) {
  // Tracks the card currently sliding out so removal/move feels smooth.
  const [exitingId, setExitingId] = useState<string | null>(null)

  function animateOut(id: string, after: () => void) {
    setExitingId(id)
    setTimeout(() => {
      after()
      setExitingId(null)
    }, 300)
  }

  if (!authed) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
          <HeartCrack className="size-6" aria-hidden />
        </span>
        <p className="font-medium">Guarda tus favoritos</p>
        <p className="text-sm text-muted-foreground">
          Inicia sesión para guardar tus artículos favoritos y verlos en cualquier dispositivo.
        </p>
        <button
          type="button"
          onClick={onLogin}
          className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Iniciar sesión
        </button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground/60">
          <Heart className="size-6" aria-hidden />
        </span>
        <p className="font-medium">Tu lista de deseos está vacía</p>
        <p className="text-sm text-muted-foreground">
          Toca el corazón en cualquier producto para guardarlo aquí.
        </p>
        <button
          type="button"
          onClick={onExplore}
          className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Explorar productos
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      <ul className="flex flex-col gap-4">
        {items.map((w) => (
          <li
            key={w.id}
            className={cn(
              'flex gap-3 transition-all duration-300 ease-out',
              exitingId === w.id && 'translate-x-full opacity-0',
            )}
          >
            <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-muted via-card to-muted/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={placeholderImage(w.category)} alt="" className="absolute inset-0 size-full object-cover" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate text-sm font-medium">{w.name}</p>
              <p className="text-xs text-muted-foreground">{categoryLabel[w.category]}</p>
              <p className="text-sm font-semibold tabular-nums">{cop.format(w.price)}</p>
              <button
                type="button"
                onClick={() => animateOut(w.id, () => { addToCart(w); removeFromWishlist(w.id) })}
                className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ShoppingBag className="size-3.5" aria-hidden />
                Mover al carrito
              </button>
            </div>
            <button
              type="button"
              onClick={() => animateOut(w.id, () => removeFromWishlist(w.id))}
              aria-label={`Eliminar ${w.name} de la lista`}
              className="self-start rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
