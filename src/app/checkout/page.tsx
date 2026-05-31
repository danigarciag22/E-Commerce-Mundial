'use client'

import { startTransition, useActionState, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CreditCard, Lock, ShieldCheck } from 'lucide-react'
import { useCartStore } from '@/lib/cart/cartStore'
import { useHydrated } from '@/lib/hooks/useHydrated'
import { checkDiscountAction } from '@/lib/discounts/checkDiscountAction'
import { applyDiscountToItems } from '@/lib/discounts/discountMath'
import { shippingFor, FREE_SHIPPING_THRESHOLD } from '@/lib/cart/promos'
import { placeholderImage } from '@/lib/products/placeholderImage'
import { cn } from '@/lib/utils'

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

// Floating-label field. Module-level for a stable component identity.
function FloatingField({
  id,
  label,
  type = 'text',
  autoComplete,
  value,
  onChange,
  required,
  className,
}: {
  id: string
  label: string
  type?: string
  autoComplete?: string
  value?: string
  onChange?: (v: string) => void
  required?: boolean
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        placeholder=" "
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="peer h-14 w-full rounded-xl border border-border bg-background px-3 pt-4 pb-1 text-sm shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-[&:not(:placeholder-shown)]:top-2.5 peer-[&:not(:placeholder-shown)]:translate-y-0 peer-[&:not(:placeholder-shown)]:text-xs"
      >
        {label}
      </label>
    </div>
  )
}

// Visual-only express-pay button (wire to Google Pay / PayPal SDKs later).
function ExpressButton({ label, className }: { label: string; className?: string }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-semibold shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {label}
    </button>
  )
}

export default function CheckoutPage() {
  const mounted = useHydrated()
  const items = useCartStore((s) => s.items)
  const promoCode = useCartStore((s) => s.promoCode)

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [codeState, codeAction, codePending] = useActionState(checkDiscountAction, null)
  const discount = codeState?.ok ? { code: codeState.code, percent: codeState.percent } : null

  // Carry a coupon applied in the cart drawer into checkout (re-validated here).
  const prefilled = useRef(false)
  useEffect(() => {
    if (prefilled.current || !promoCode || codeState) return
    prefilled.current = true
    const fd = new FormData()
    fd.set('code', promoCode)
    startTransition(() => codeAction(fd))
  }, [promoCode, codeState, codeAction])

  const preview = applyDiscountToItems(items, discount?.percent ?? 0)
  // Free shipping is based on the merchandise subtotal (pre-discount), matching
  // the cart drawer's progress bar — so a coupon never silently adds shipping.
  const shipping = shippingFor(preview.subtotal)
  const total = preview.total + shipping

  async function handlePay() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, email, code: discount?.code ?? '' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al iniciar el pago')
      window.location.assign(data.init_point)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al iniciar el pago')
      setLoading(false)
    }
  }

  if (!mounted) return <div className="mx-auto w-full max-w-6xl px-4 py-12" />

  if (items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Tu carrito está vacío</h1>
        <p className="mt-2 text-muted-foreground">Agrega productos antes de pagar.</p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Ver productos
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_minmax(340px,400px)] lg:px-8">
      {/* LEFT — data & payment */}
      <div className="flex flex-col gap-8">
        <h1 className="text-2xl font-bold tracking-tight">Finalizar compra</h1>

        {/* Express pay */}
        <section className="flex flex-col gap-3">
          <div className="flex gap-3">
            {/* TODO: wire Google Pay / PayPal SDK button handlers */}
            <ExpressButton label="Google Pay" className="bg-foreground text-background" />
            <ExpressButton label="PayPal" className="bg-[#ffc439] text-[#003087]" />
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            o paga con tarjeta
            <span className="h-px flex-1 bg-border" />
          </div>
        </section>

        {/* Contact */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Contacto</h2>
            <span className="text-xs text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login?next=/checkout" className="font-medium text-foreground hover:underline">
                Iniciar sesión
              </Link>
            </span>
          </div>
          <FloatingField id="email" label="Correo electrónico" type="email" autoComplete="email" value={email} onChange={setEmail} required />
          <p className="text-xs text-muted-foreground">Puedes comprar como invitado, no necesitas cuenta.</p>
        </section>

        {/* Delivery — floating labels. Front-end only for now; Mercado Pago
            Checkout Pro also collects shipping on its side. */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Entrega</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <FloatingField id="first_name" label="Nombre" autoComplete="given-name" />
            <FloatingField id="last_name" label="Apellidos" autoComplete="family-name" />
          </div>
          <FloatingField id="address" label="Dirección" autoComplete="street-address" />
          <div className="grid gap-3 sm:grid-cols-2">
            <FloatingField id="city" label="Ciudad" autoComplete="address-level2" />
            <FloatingField id="phone" label="Teléfono" type="tel" autoComplete="tel" />
          </div>
        </section>

        {/* Payment — visual placeholder. Real charge goes through Mercado Pago
            Checkout Pro (redirect) on "Pagar Ahora". To embed card fields here
            instead, mount the Mercado Pago Bricks CardPayment SDK in this box:
            https://www.mercadopago.com.co/developers/en/docs/checkout-bricks */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pago</h2>
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="size-4" aria-hidden />
              Tarjeta de crédito o débito
            </div>
            <div className="mt-3 flex flex-col gap-3 opacity-60">
              <div className="relative">
                <input disabled placeholder="0000 0000 0000 0000" className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm" />
                <CreditCard className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input disabled placeholder="MM / AA" className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm" />
                <input disabled placeholder="CVC" className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm" />
              </div>
            </div>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3.5" aria-hidden />
              Serás redirigido a Mercado Pago para completar el pago de forma segura.
            </p>
          </div>
        </section>
      </div>

      {/* RIGHT — order summary */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border border-border bg-muted/40 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Resumen de la orden</h2>

          <ul className="mt-4 flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-gradient-to-br from-muted via-card to-muted/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={placeholderImage(item.category)} alt="" className="absolute inset-0 size-full object-cover" />
                  <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-primary text-[0.65rem] font-bold tabular-nums text-primary-foreground">
                    {item.quantity}
                  </span>
                </div>
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</p>
                <span className="text-sm font-semibold tabular-nums">{cop.format(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>

          {/* Discount */}
          <form action={(fd) => startTransition(() => codeAction(fd))} className="mt-5 flex gap-2 border-t border-border pt-5">
            <input
              name="code"
              type="text"
              placeholder="Código de descuento"
              defaultValue={promoCode ?? ''}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm uppercase shadow-sm placeholder:normal-case focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              disabled={codePending}
              className="shrink-0 rounded-lg border border-border bg-secondary px-4 text-sm font-medium text-secondary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {codePending ? '…' : 'Aplicar'}
            </button>
          </form>
          {codeState && !codeState.ok && (
            <p className="mt-2 text-xs font-medium text-destructive">{codeState.error}</p>
          )}

          {/* Totals */}
          <dl className="mt-5 flex flex-col gap-2 border-t border-border pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{cop.format(preview.subtotal)}</dd>
            </div>
            {discount && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-500">
                <dt>Descuento ({discount.percent}%)</dt>
                <dd className="tabular-nums">−{cop.format(preview.discountAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Envío</dt>
              <dd className="tabular-nums">
                {shipping === 0 ? <span className="font-medium text-emerald-600 dark:text-emerald-500">Gratis</span> : cop.format(shipping)}
              </dd>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-muted-foreground">
                Envío gratis en compras desde {cop.format(FREE_SHIPPING_THRESHOLD)}.
              </p>
            )}
            <div className="mt-1 flex justify-between border-t border-border pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{cop.format(total)}</dd>
            </div>
          </dl>

          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handlePay}
            disabled={loading || !email}
            className={cn(
              'mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition',
              'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            <ShieldCheck className="size-4" aria-hidden />
            {loading ? 'Redirigiendo…' : 'Pagar Ahora'}
          </button>
        </div>
      </aside>
    </main>
  )
}
