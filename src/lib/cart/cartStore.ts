import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from './types'

type NewItem = Omit<CartItem, 'quantity'>

type CartState = {
  items: CartItem[]
  // Ephemeral trigger for the post-add promo popup (not persisted). `lastAddedAt`
  // changes on every addItem so listeners can re-open even for the same product.
  lastAddedId: string | null
  lastAddedAt: number
  addItem: (item: NewItem) => void
  removeItem: (id: string) => void
  setQuantity: (id: string, quantity: number) => void
  clear: () => void
  totalCount: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      lastAddedId: null,
      lastAddedAt: 0,
      addItem: (item) =>
        set((state) => {
          const trigger = { lastAddedId: item.id, lastAddedAt: Date.now() }
          const existing = state.items.find((i) => i.id === item.id)
          if (existing) {
            return {
              ...trigger,
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
              ),
            }
          }
          return { ...trigger, items: [...state.items, { ...item, quantity: 1 }] }
        }),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      setQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),
      clear: () => set({ items: [] }),
      totalCount: () => get().items.reduce((n, i) => n + i.quantity, 0),
      totalPrice: () => get().items.reduce((n, i) => n + i.price * i.quantity, 0),
    }),
    {
      name: 'cart-storage',
      // Persist only the cart contents — the popup trigger must stay ephemeral
      // so a page reload never re-opens the promo popup.
      partialize: (state) => ({ items: state.items }),
    },
  ),
)
