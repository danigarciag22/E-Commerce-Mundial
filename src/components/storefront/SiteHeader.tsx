import Link from 'next/link'
import { CartButton } from '@/components/cart/CartButton'
import { UserMenu } from '@/components/auth/UserMenu'
import { SearchBar } from '@/components/storefront/SearchBar'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 font-bold tracking-tight">
          <span aria-hidden className="grid size-7 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">26</span>
          <span>Tienda Mundial</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-muted-foreground sm:flex">
          <Link href="/" className="hover:text-foreground">Productos</Link>
          <Link href="/colecciones" className="hover:text-foreground">Colecciones</Link>
        </nav>
        <SearchBar />
        <div className="ml-auto flex items-center gap-3">
          <CartButton />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
