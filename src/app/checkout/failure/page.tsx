import Link from 'next/link'
import { XCircle } from 'lucide-react'

export default function CheckoutFailure() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-16 text-center sm:px-6 lg:px-8">
      <XCircle
        className="mx-auto mb-4 size-12 text-destructive"
        aria-hidden
      />
      <h1 className="text-2xl font-bold tracking-tight">
        El pago no se completó
      </h1>
      <p className="mt-2 text-muted-foreground">
        No se realizó ningún cargo. Puedes volver al carrito e intentarlo de
        nuevo.
      </p>
      <Link
        href="/carrito"
        className="mt-6 inline-block rounded-md font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Volver al carrito
      </Link>
    </main>
  )
}
