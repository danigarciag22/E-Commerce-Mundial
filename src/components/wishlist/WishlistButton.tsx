'use client'

import { useRef, useState } from 'react'
import { Heart } from 'lucide-react'
import { useWishlistStore, type WishlistItem } from '@/lib/wishlist/wishlistStore'
import { useHydrated } from '@/lib/hooks/useHydrated'
import { useAuth } from '@/components/auth/AuthContext'
import { useAuthModalStore } from '@/lib/auth/authModalStore'
import { cn } from '@/lib/utils'

// Reusable wishlist heart.
// - Guest → opens the auth modal (never saves).
// - Authenticated → optimistic toggle (instant fill + pop) while the backend
//   call runs in the background.
export function WishlistButton({
  product,
  className,
}: {
  product: WishlistItem
  className?: string
}) {
  const hydrated = useHydrated()
  const { isAuthenticated } = useAuth()
  const openModal = useAuthModalStore((s) => s.openModal)

  const toggle = useWishlistStore((s) => s.toggle)
  const saved = useWishlistStore((s) => s.items.some((i) => i.id === product.id))
  const active = hydrated && saved

  const [pop, setPop] = useState(false)
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleClick() {
    if (!isAuthenticated) {
      // Don't save for guests — prompt sign-in instead.
      openModal('/')
      return
    }

    const willSave = !saved
    // Optimistic UI: flip local state immediately.
    toggle(product)
    if (willSave) {
      setPop(true)
      if (popTimer.current) clearTimeout(popTimer.current)
      popTimer.current = setTimeout(() => setPop(false), 220)
    }

    // Fire-and-forget backend sync (UI already updated).
    // TODO: persist to backend, e.g.
    //   willSave ? fetch('/api/wishlist', { method: 'POST', body: JSON.stringify({ productId: product.id }) })
    //            : fetch(`/api/wishlist/${product.id}`, { method: 'DELETE' })
    // On failure, revert with toggle(product) and surface a toast.
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? `Quitar ${product.name} de favoritos` : `Guardar ${product.name} en favoritos`}
      className={cn(
        'grid size-8 place-items-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90',
        className,
      )}
    >
      <Heart
        className={cn(
          'size-4 transition-all duration-200',
          active && 'fill-red-500 text-red-500',
          pop && 'scale-125',
        )}
        aria-hidden
      />
    </button>
  )
}
