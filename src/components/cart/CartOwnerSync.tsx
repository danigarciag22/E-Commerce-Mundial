'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/lib/cart/cartStore'

// Reconciles cart ownership on every load / auth change:
// - guest cart is claimed (merged) on first login
// - logout or a different user clears the previous owner's cart
// Runs against the user resolved on the server, so it works regardless of how
// sign-out happened (no reliance on client auth events).
export function CartOwnerSync({ userId }: { userId: string | null }) {
  useEffect(() => {
    // Calling a zustand action (not React setState) — safe inside an effect.
    useCartStore.getState().reconcileOwner(userId)
  }, [userId])

  return null
}
