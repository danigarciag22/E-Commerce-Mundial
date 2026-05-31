import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Truck, Undo2 } from 'lucide-react'
import { AuthCard } from '@/components/auth/AuthCard'

type SearchParams = Promise<{ tab?: string; next?: string; error?: string }>

const perks = [
  { icon: Truck, text: 'Envío rápido certificado a todo el país' },
  { icon: Undo2, text: 'Devoluciones gratuitas durante 30 días' },
  { icon: ShieldCheck, text: 'Pago seguro y datos encriptados' },
]

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const tab = sp.tab === 'signup' ? 'signup' : 'signin'
  const next = typeof sp.next === 'string' && sp.next.startsWith('/') ? sp.next : '/'

  return (
    <main className="mx-auto grid w-full max-w-5xl flex-1 gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
      {/* Brand / trust panel */}
      <section className="hidden flex-col gap-8 lg:flex">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver a la tienda
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Tu camino al Mundial 2026 empieza aquí.
          </h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            Crea tu cuenta para comprar más rápido, seguir tus pedidos y guardar tus favoritos.
          </p>
        </div>
        <ul className="flex flex-col gap-4">
          {perks.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm">
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-card text-foreground">
                <Icon className="size-4" aria-hidden />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </section>

      {/* Auth card */}
      <section className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver a la tienda
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {sp.error === 'oauth' && (
            <p role="alert" className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              No se pudo completar el inicio de sesión social. Intenta de nuevo.
            </p>
          )}
          <AuthCard defaultTab={tab} next={next} />
        </div>

        {/* TEMP — credenciales admin de prueba. Solo dev, y solo si se definen
            en .env.local (gitignored). Nunca se hardcodean en el repo.
            BORRAR antes de producción. */}
        {process.env.NODE_ENV !== 'production' &&
          process.env.NEXT_PUBLIC_DEV_ADMIN_EMAIL && (
            <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">🔧 Admin de prueba (solo dev)</p>
              <p className="mt-1 font-mono text-xs">
                {process.env.NEXT_PUBLIC_DEV_ADMIN_EMAIL}
                {process.env.NEXT_PUBLIC_DEV_ADMIN_PASSWORD && (
                  <>
                    <br />
                    {process.env.NEXT_PUBLIC_DEV_ADMIN_PASSWORD}
                  </>
                )}
              </p>
            </div>
          )}
      </section>
    </main>
  )
}
