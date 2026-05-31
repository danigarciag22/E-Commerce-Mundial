import Link from 'next/link'
import { Lock } from 'lucide-react'

// Dedicated checkout chrome: a slim secure bar, no shop header/footer, to
// minimise distractions and conversion leaks during payment.
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold tracking-tight">
            <span aria-hidden className="grid size-7 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">
              26
            </span>
            <span>Tienda Mundial</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Lock className="size-3.5" aria-hidden />
            Pago seguro
          </span>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  )
}
