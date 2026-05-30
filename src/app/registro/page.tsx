'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp, type AuthActionState } from '@/lib/auth/actions'
import { cn } from '@/lib/utils'

export default function RegistroPage() {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    signUp,
    null,
  )

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Crear cuenta
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Regístrate para comprar y seguir tus pedidos.
      </p>

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
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
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
          {pending ? 'Creando…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link
          href="/login"
          className="rounded-sm font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Inicia sesión
        </Link>
      </p>
    </main>
  )
}
