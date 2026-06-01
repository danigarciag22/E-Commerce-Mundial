'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Check, Copy, Gift, Mail, X } from 'lucide-react'
import { useNewsletterStore } from '@/lib/newsletter/newsletterStore'
import { useHydrated } from '@/lib/hooks/useHydrated'
import { isEmailValid } from '@/lib/auth/passwordRules'
import { cn } from '@/lib/utils'

// Welcome offer: reuse an existing active discount code so it actually works
// at checkout (no DB write). Tune here.
const WELCOME_CODE = 'MUNDIAL10'
const WELCOME_PERCENT = 10
const SHOW_DELAY_MS = 5000

export function NewsletterModal() {
  const hydrated = useHydrated()
  const status = useNewsletterStore((s) => s.status)
  const subscribe = useNewsletterStore((s) => s.subscribe)
  const dismiss = useNewsletterStore((s) => s.dismiss)

  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Show once, a few seconds after load, only if not yet resolved — and never
  // stacked on top of another open dialog (auth modal / cart drawer). If one is
  // open, retry shortly so the offer still appears once it's dismissed.
  useEffect(() => {
    if (!hydrated || status !== 'idle') return
    let timer: ReturnType<typeof setTimeout>
    const tryOpen = () => {
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) {
        timer = setTimeout(tryOpen, 3000)
        return
      }
      setOpen(true)
    }
    timer = setTimeout(tryOpen, SHOW_DELAY_MS)
    return () => clearTimeout(timer)
  }, [hydrated, status])

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current) }, [])

  const valid = isEmailValid(email)
  const showError = touched && email.length > 0 && !valid

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) {
      setTouched(true)
      return
    }
    subscribe(email.trim())
    setDone(true)
    // TODO: persist subscriber, e.g.
    //   fetch('/api/newsletter', { method: 'POST', body: JSON.stringify({ email }) })
  }

  function handleOpenChange(next: boolean) {
    // Closing without subscribing counts as a dismissal (won't show again).
    if (!next && !done) dismiss()
    setOpen(next)
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(WELCOME_CODE)
      setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard blocked — code is visible to copy manually
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl outline-none transition-all duration-300 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <Dialog.Close
            aria-label="Cerrar"
            className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden />
          </Dialog.Close>

          {/* Banner */}
          <div className="flex flex-col items-center gap-1 bg-gradient-to-br from-primary to-primary/80 px-6 py-7 text-center text-primary-foreground">
            <Gift className="size-7" aria-hidden />
            <p className="text-4xl font-black tracking-tight">{WELCOME_PERCENT}% OFF</p>
            <p className="text-sm font-medium opacity-90">en tu primera compra</p>
          </div>

          <div className="p-6">
            {done ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <Dialog.Title className="text-lg font-bold tracking-tight">¡Bienvenido al equipo! 🎉</Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  Usa este código al pagar para tu {WELCOME_PERCENT}% de descuento:
                </Dialog.Description>
                <button
                  type="button"
                  onClick={copyCode}
                  className="group inline-flex items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-muted/50 px-4 py-2.5 font-mono text-lg font-bold tracking-wider transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {WELCOME_CODE}
                  {copied ? (
                    <Check className="size-4 text-emerald-500" aria-hidden />
                  ) : (
                    <Copy className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden />
                  )}
                </button>
                <p className="text-xs text-muted-foreground">{copied ? '¡Copiado!' : 'Toca para copiar'}</p>
              </div>
            ) : (
              <>
                <Dialog.Title className="text-center text-lg font-bold tracking-tight">
                  Suscríbete y ahorra
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-center text-sm text-muted-foreground">
                  Únete a nuestro boletín y recibe un {WELCOME_PERCENT}% de descuento, novedades y lanzamientos exclusivos.
                </Dialog.Description>

                <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched(true)}
                      aria-invalid={showError}
                      className={cn(
                        'h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        showError ? 'border-destructive focus-visible:ring-destructive/30' : 'border-border focus-visible:border-ring',
                      )}
                    />
                  </div>
                  {showError && (
                    <p role="alert" className="text-xs font-medium text-destructive">Ingresa un correo válido</p>
                  )}
                  <button
                    type="submit"
                    className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    Quiero mi {WELCOME_PERCENT}%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenChange(false)}
                    className="text-center text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    No, gracias
                  </button>
                </form>
                <p className="mt-3 text-center text-[0.7rem] text-muted-foreground">
                  Al suscribirte aceptas recibir correos. Puedes darte de baja cuando quieras.
                </p>
              </>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
