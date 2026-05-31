import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xs">
            <p className="flex items-center gap-2 font-bold">
              <span aria-hidden className="grid size-7 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">26</span>
              Tienda Mundial
            </p>
            <p className="mt-2 text-sm text-muted-foreground">La equipación oficial del Mundial 2026. Envíos a todo Colombia.</p>
          </div>
          <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Tienda</span>
            <Link href="/" className="hover:text-foreground">Productos</Link>
            <Link href="/colecciones" className="hover:text-foreground">Colecciones</Link>
            <Link href="/carrito" className="hover:text-foreground">Carrito</Link>
          </nav>
          <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Cuenta</span>
            <Link href="/login" className="hover:text-foreground">Iniciar sesión</Link>
            <Link href="/registro" className="hover:text-foreground">Registrarse</Link>
          </nav>
        </div>
        <p className="border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Tienda Mundial. Proyecto demo. No afiliado a la FIFA.
        </p>
      </div>
    </footer>
  )
}
