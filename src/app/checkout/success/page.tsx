'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { useCartStore } from '@/lib/cart/cartStore'

export default function CheckoutSuccess() {
  const clear = useCartStore((s) => s.clear)
  useEffect(() => {
    clear()
  }, [clear])

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-16 text-center sm:px-6 lg:px-8">
      <CheckCircle2
        className="mx-auto mb-4 size-12 text-green-600 dark:text-green-500"
        aria-hidden
      />
      <h1 className="text-2xl font-bold tracking-tight">¡Pago aprobado!</h1>
      <p className="mt-2 text-muted-foreground">
        Gracias por tu compra. Te enviamos la confirmación por correo.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Seguir comprando
      </Link>
    </main>
  )
}
