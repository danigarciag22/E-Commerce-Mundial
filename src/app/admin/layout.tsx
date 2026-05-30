import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/guards'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-8 flex items-center gap-4 border-b border-border pb-4 text-sm font-medium">
        <Link
          href="/admin"
          className="rounded-md px-1 py-0.5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Métricas
        </Link>
        <Link
          href="/admin/productos"
          className="rounded-md px-1 py-0.5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Productos
        </Link>
        <Link
          href="/"
          className="ml-auto rounded-md px-1 py-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Ver tienda →
        </Link>
      </nav>
      {children}
    </div>
  )
}
