'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isEmailValid } from '@/lib/auth/passwordRules'
import { cn } from '@/lib/utils'

export default function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  const valid = isEmailValid(email)
  const showError = touched && email.length > 0 && !valid

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) {
      setTouched(true)
      return
    }
    setStatus('loading')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/restablecer`,
    })
    setStatus(error ? 'error' : 'sent')
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-16 sm:px-6">
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver al inicio de sesión
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {status === 'sent' ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="grid size-11 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-500">
              <MailCheck className="size-5" aria-hidden />
            </span>
            <h1 className="text-xl font-bold tracking-tight">Revisa tu correo</h1>
            <p className="text-sm text-muted-foreground">
              Si existe una cuenta para <span className="font-medium text-foreground">{email}</span>,
              te enviamos un enlace para restablecer tu contraseña. Revisa también spam.
            </p>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="mt-2 text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              Usar otro correo
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-bold tracking-tight">¿Olvidaste tu contraseña?</h1>
              <p className="text-sm text-muted-foreground">
                Ingresa tu correo y te enviaremos un enlace para crear una nueva.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium">Correo electrónico</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    required
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched(true)}
                    aria-invalid={showError}
                    className={cn(
                      'h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      showError
                        ? 'border-destructive focus-visible:ring-destructive/30'
                        : 'border-border focus-visible:border-ring',
                    )}
                  />
                </div>
                {showError && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    Ingresa un correo electrónico válido
                  </p>
                )}
              </div>

              {status === 'error' && (
                <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                  No pudimos enviar el correo. Intenta de nuevo en un momento.
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className={cn(
                  'inline-flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition',
                  'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                {status === 'loading' ? 'Enviando…' : 'Enviar enlace de recuperación'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
