import Link from 'next/link'
import { Clock } from 'lucide-react'

export default function CheckoutPending() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-16 text-center sm:px-6 lg:px-8">
      <Clock
        className="mx-auto mb-4 size-12 text-amber-500"
        aria-hidden
      />
      <h1 className="text-2xl font-bold tracking-tight">Pago pendiente</h1>
      <p className="mt-2 text-muted-foreground">
        Tu pago está siendo procesado. Te enviaremos la confirmación por correo
        en cuanto sea aprobado.
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
