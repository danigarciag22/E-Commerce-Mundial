'use client'

import { useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { AuthCard } from './AuthCard'

// Header entry point: opens the unified auth experience as a modal so the user
// never leaves the current page. /login stays available as a deep-link fallback.
export function AuthTrigger({ next = '/' }: { next?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="rounded-md text-sm font-medium transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        Iniciar sesión
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl outline-none transition-all duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 sm:p-8">
          <Dialog.Title className="sr-only">Acceder a tu cuenta</Dialog.Title>
          <Dialog.Description className="sr-only">
            Inicia sesión o crea una cuenta en la Tienda Mundial 2026.
          </Dialog.Description>
          <AuthCard next={next} onClose={() => setOpen(false)} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
