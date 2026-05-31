'use client'

import { useAuthModalStore } from '@/lib/auth/authModalStore'

// Header entry point: opens the global auth modal (rendered once by
// AuthModalHost) so the user never leaves the page.
export function AuthTrigger({ next = '/' }: { next?: string }) {
  const openModal = useAuthModalStore((s) => s.openModal)

  return (
    <button
      type="button"
      onClick={() => openModal(next)}
      className="rounded-md text-sm font-medium transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      Iniciar sesión
    </button>
  )
}
