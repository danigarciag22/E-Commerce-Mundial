'use client'

import { Dialog } from '@base-ui/react/dialog'
import { useAuthModalStore } from '@/lib/auth/authModalStore'
import { AuthCard } from './AuthCard'

// Single global instance of the auth modal. Opened from anywhere via
// useAuthModalStore().openModal() — header button, wishlist heart, etc.
// AuthCard closes it via onClose on successful sign-in/up.
export function AuthModalHost() {
  const open = useAuthModalStore((s) => s.open)
  const next = useAuthModalStore((s) => s.next)
  const setOpen = useAuthModalStore((s) => s.setOpen)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
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
