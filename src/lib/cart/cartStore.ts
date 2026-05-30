import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from './types'

type NewItem = Omit<CartItem, 'quantity'>

type CartState = {
  items: CartItem[]
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
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: 1 }] }
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
    { name: 'cart-storage' },
  ),
)
