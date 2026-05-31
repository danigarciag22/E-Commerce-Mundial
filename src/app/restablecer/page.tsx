'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { checkPassword, isPasswordValid } from '@/lib/auth/passwordRules'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { cn } from '@/lib/utils'

export default function RestablecerPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  const checks = checkPassword(password)
  const valid = isPasswordValid(password)
  const matches = confirm.length > 0 && confirm === password
  const canSubmit = valid && matches && status !== 'loading'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setStatus('loading')
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setStatus('idle')
      setError('El enlace expiró o no es válido. Solicita uno nuevo.')
      return
    }
    setStatus('done')
    router.refresh()
    setTimeout(() => router.push('/'), 1500)
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {status === 'done' ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="grid size-11 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-500">
              <Check className="size-5" aria-hidden />
            </span>
            <h1 className="text-xl font-bold tracking-tight">Contraseña actualizada</h1>
            <p className="text-sm text-muted-foreground">
              Tu contraseña se cambió correctamente. Redirigiéndote…
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-bold tracking-tight">Crea una nueva contraseña</h1>
              <p className="text-sm text-muted-foreground">
                Elige una contraseña segura para tu cuenta.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium">Nueva contraseña</label>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="Crea una contraseña segura"
                  value={password}
                  onChange={setPassword}
                />
                <ul className="mt-1.5 grid gap-1">
                  {checks.map((c) => (
                    <li
                      key={c.id}
                      className={cn(
                        'flex items-center gap-1.5 text-xs transition-colors',
                        c.ok ? 'text-emerald-600 dark:text-emerald-500' : 'text-muted-foreground',
                      )}
                    >
                      <span
                        className={cn(
                          'grid size-4 place-items-center rounded-full border transition-colors',
                          c.ok ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border',
                        )}
                      >
                        {c.ok && <Check className="size-3" aria-hidden />}
                      </span>
                      {c.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm" className="text-sm font-medium">Confirmar contraseña</label>
                <PasswordInput
                  id="confirm"
                  name="confirm"
                  autoComplete="new-password"
                  placeholder="Repite la contraseña"
                  value={confirm}
                  onChange={setConfirm}
                />
                {confirm.length > 0 && !matches && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    Las contraseñas no coinciden
                  </p>
                )}
              </div>

              {error && (
                <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                  {error}{' '}
                  <Link href="/recuperar" className="underline underline-offset-4">
                    Solicitar enlace
                  </Link>
                </p>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className={cn(
                  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition',
                  'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                <ShieldCheck className="size-4" aria-hidden />
                {status === 'loading' ? 'Guardando…' : 'Guardar contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
