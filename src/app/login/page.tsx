'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn, type AuthActionState } from '@/lib/auth/actions'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    signIn,
    null,
  )

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Iniciar sesión
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Accede a tu cuenta para continuar.
      </p>

      {/* TEMP — credenciales admin de prueba. Solo visible en desarrollo.
          BORRAR antes de producción (no se renderiza si NODE_ENV=production). */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">🔧 Admin de prueba (solo dev)</p>
          <p className="mt-1 font-mono text-xs">
            danigarcia222005@gmail.com
            <br />
            admin12345
          </p>
        </div>
      )}

      <form
        action={formAction}
        className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Correo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="tu@correo.com"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {state?.error && (
          <p role="alert" className="mt-3 text-sm font-medium text-destructive">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className={cn(
            'mt-6 flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition',
            'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {pending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{' '}
        <Link
          href="/registro"
          className="rounded-sm font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Regístrate
        </Link>
      </p>
    </main>
  )
}
