import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProductCategory } from '@/lib/products/types'

export type WishlistItem = {
  id: string
  name: string
  price: number
  category: ProductCategory
}

type WishlistState = {
  items: WishlistItem[]
  // Same ownership model as the cart: a guest wishlist is claimed on first
  // login, and clears on logout / a different user (see CartOwnerSync, which
  // reconciles both stores). Cross-device persistence would need a DB table.
  ownerId: string | null
  toggle: (item: WishlistItem) => void
  remove: (id: string) => void
  has: (id: string) => boolean
  clear: () => void
  reconcileOwner: (userId: string | null) => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      ownerId: null,
      toggle: (item) =>
        set((state) =>
          state.items.some((i) => i.id === item.id)
            ? { items: state.items.filter((i) => i.id !== item.id) }
            : { items: [...state.items, item] },
        ),
      remove: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      has: (id) => get().items.some((i) => i.id === id),
      clear: () => set({ items: [] }),
      reconcileOwner: (userId) =>
        set((state) => {
          if (state.ownerId === userId) return {}
          const claimingGuest = state.ownerId === null && userId !== null
          return claimingGuest ? { ownerId: userId } : { ownerId: userId, items: [] }
        }),
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({ items: state.items, ownerId: state.ownerId }),
    },
  ),
)
