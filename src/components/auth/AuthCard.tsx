'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, Mail, ShieldCheck, User, X } from 'lucide-react'
import { signIn, signUp, type AuthActionState } from '@/lib/auth/actions'
import { checkPassword, isEmailValid } from '@/lib/auth/passwordRules'
import { createClient } from '@/lib/supabase/client'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { cn } from '@/lib/utils'

type Tab = 'signin' | 'signup'
type OAuthProvider = 'google' | 'apple'

type Props = {
  defaultTab?: Tab
  next?: string
  /** Rendered inside a modal — shows a close button wired to onClose. */
  onClose?: () => void
}

const inputBase =
  'h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
      <path d="M16.37 12.78c.03 2.92 2.56 3.89 2.59 3.9-.02.07-.4 1.39-1.34 2.75-.8 1.18-1.64 2.35-2.96 2.37-1.3.03-1.72-.77-3.2-.77-1.49 0-1.95.75-3.18.8-1.27.05-2.24-1.27-3.05-2.44-1.65-2.4-2.91-6.77-1.22-9.72.84-1.47 2.34-2.4 3.97-2.42 1.25-.03 2.43.84 3.2.84.76 0 2.2-1.04 3.71-.89.63.03 2.4.26 3.54 1.92-.09.06-2.11 1.24-2.09 3.69M13.94 4.3c.68-.83 1.14-1.98.99-3.13-.98.04-2.17.65-2.88 1.48-.63.73-1.19 1.9-1.04 3.02 1.1.09 2.24-.55 2.93-1.37" />
    </svg>
  )
}

export function AuthCard({ defaultTab = 'signin', next = '/', onClose }: Props) {
  const [tab, setTab] = useState<Tab>(defaultTab)
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [signupPwd, setSignupPwd] = useState('')
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null)

  const emailRef = useRef<HTMLInputElement>(null)
  const [signInState, signInAction, signInPending] = useActionState<AuthActionState, FormData>(signIn, null)
  const [signUpState, signUpAction, signUpPending] = useActionState<AuthActionState, FormData>(signUp, null)

  const isSignup = tab === 'signup'
  const action = isSignup ? signUpAction : signInAction
  const state = isSignup ? signUpState : signInState
  const pending = isSignup ? signUpPending : signInPending

  // Autofocus the email field on first render and whenever the tab switches.
  useEffect(() => {
    emailRef.current?.focus()
  }, [tab])

  const emailValid = isEmailValid(email)
  const emailError = emailTouched && email.length > 0 && !emailValid
  const emailSuccess = email.length > 0 && emailValid
  const pwChecks = checkPassword(signupPwd)

  async function handleOAuth(provider: OAuthProvider) {
    setOauthLoading(provider)
    try {
      const supabase = createClient()
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      })
    } catch {
      setOauthLoading(null)
    }
  }

  return (
    <div className="w-full">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}

      <div className="flex flex-col items-center gap-1 text-center">
        <span aria-hidden className="grid size-10 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground">
          26
        </span>
        <h2 className="mt-1 text-xl font-bold tracking-tight">
          {isSignup ? 'Crea tu cuenta' : 'Bienvenido de vuelta'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isSignup ? 'Únete a la Tienda Mundial 2026.' : 'Inicia sesión para continuar.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="relative mt-6 grid grid-cols-2 rounded-full bg-muted p-1 text-sm font-medium">
        <span
          aria-hidden
          className="absolute inset-y-1 w-1/2 rounded-full bg-background shadow-sm transition-transform duration-300 ease-out"
          style={{ transform: isSignup ? 'translateX(100%)' : 'translateX(0)' }}
        />
        <button
          type="button"
          onClick={() => setTab('signin')}
          aria-pressed={!isSignup}
          className={cn(
            'relative z-10 rounded-full py-2 transition-colors focus-visible:outline-none',
            !isSignup ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => setTab('signup')}
          aria-pressed={isSignup}
          className={cn(
            'relative z-10 rounded-full py-2 transition-colors focus-visible:outline-none',
            isSignup ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Registrarse
        </button>
      </div>

      {/* Social */}
      <div className="mt-6 grid gap-2.5">
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          disabled={oauthLoading !== null}
          className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-background text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <GoogleIcon />
          {oauthLoading === 'google' ? 'Conectando…' : 'Continuar con Google'}
        </button>
        <button
          type="button"
          onClick={() => handleOAuth('apple')}
          disabled={oauthLoading !== null}
          className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-background text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <AppleIcon />
          {oauthLoading === 'apple' ? 'Conectando…' : 'Continuar con Apple'}
        </button>
      </div>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        O continuar con
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* Animated form region */}
      <form key={tab} action={action} className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <input type="hidden" name="next" value={next} />

        {isSignup && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="full_name" className="text-sm font-medium">Nombre completo</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                required
                placeholder="Lionel Messi"
                className={cn(inputBase, 'border-border focus-visible:border-ring')}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">Correo electrónico</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              aria-invalid={emailError}
              className={cn(
                inputBase,
                'pr-10',
                emailError
                  ? 'border-destructive focus-visible:ring-destructive/30'
                  : emailSuccess
                    ? 'border-emerald-500 focus-visible:ring-emerald-500/30'
                    : 'border-border focus-visible:border-ring',
              )}
            />
            {emailSuccess && (
              <Check className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-emerald-500" aria-hidden />
            )}
          </div>
          {emailError && (
            <p role="alert" className="text-xs font-medium text-destructive">
              Ingresa un correo electrónico válido
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
            {!isSignup && (
              <Link
                href="/recuperar"
                className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            )}
          </div>
          {isSignup ? (
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              placeholder="Crea una contraseña segura"
              value={signupPwd}
              onChange={setSignupPwd}
            />
          ) : (
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="Tu contraseña"
            />
          )}

          {isSignup && (
            <ul className="mt-1.5 grid gap-1">
              {pwChecks.map((c) => (
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
          )}
        </div>

        {!isSignup && (
          <label className="flex select-none items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="size-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            Mantener mi sesión iniciada
          </label>
        )}

        {state?.error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className={cn(
            'mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition',
            'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {pending ? (
            isSignup ? 'Creando cuenta…' : 'Entrando…'
          ) : (
            <>
              <ShieldCheck className="size-4" aria-hidden />
              {isSignup ? 'Crear mi cuenta' : 'Entrar de forma segura'}
            </>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        {isSignup ? (
          <>Al crear tu cuenta aceptas nuestros Términos y la Política de Privacidad.</>
        ) : (
          <>
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => setTab('signup')}
              className="rounded-sm font-medium text-foreground underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Regístrate gratis
            </button>
          </>
        )}
      </p>
    </div>
  )
}
