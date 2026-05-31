import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '@/lib/cart/cartStore'
import type { CartItem } from '@/lib/cart/types'

const product: Omit<CartItem, 'quantity'> = {
  id: 'p1', name: 'Balón', price: 100, category: 'balon',
}

beforeEach(() => {
  useCartStore.getState().clear()
  useCartStore.getState().reconcileOwner(null)
  useCartStore.setState({ ownerId: null })
  localStorage.clear()
})

describe('cartStore', () => {
  it('adds a new item with quantity 1', () => {
    useCartStore.getState().addItem(product)
    expect(useCartStore.getState().items).toEqual([{ ...product, quantity: 1 }])
  })
  it('increments quantity when adding an existing item', () => {
    const { addItem } = useCartStore.getState()
    addItem(product); addItem(product)
    expect(useCartStore.getState().items[0].quantity).toBe(2)
  })
  it('setQuantity updates an item; zero removes it', () => {
    const { addItem, setQuantity } = useCartStore.getState()
    addItem(product)
    setQuantity('p1', 5)
    expect(useCartStore.getState().items[0].quantity).toBe(5)
    setQuantity('p1', 0)
    expect(useCartStore.getState().items).toHaveLength(0)
  })
  it('removeItem deletes the line', () => {
    const { addItem, removeItem } = useCartStore.getState()
    addItem(product); removeItem('p1')
    expect(useCartStore.getState().items).toHaveLength(0)
  })
  it('totalCount sums quantities', () => {
    const { addItem } = useCartStore.getState()
    addItem(product); addItem(product)
    addItem({ id: 'p2', name: 'Gorra', price: 50, category: 'merchandising' })
    expect(useCartStore.getState().totalCount()).toBe(3)
  })
  it('totalPrice sums price * quantity', () => {
    const { addItem } = useCartStore.getState()
    addItem(product); addItem(product)
    addItem({ id: 'p2', name: 'Gorra', price: 50, category: 'merchandising' })
    expect(useCartStore.getState().totalPrice()).toBe(250)
  })
  it('clear empties the cart', () => {
    const { addItem, clear } = useCartStore.getState()
    addItem(product); clear()
    expect(useCartStore.getState().items).toEqual([])
  })

  describe('reconcileOwner', () => {
    it('claims a guest cart on first login, keeping items (merge)', () => {
      useCartStore.getState().addItem(product)
      useCartStore.getState().reconcileOwner('user-a')
      expect(useCartStore.getState().ownerId).toBe('user-a')
      expect(useCartStore.getState().items).toHaveLength(1)
    })

    it('clears the cart on logout (owner -> null)', () => {
      useCartStore.getState().addItem(product)
      useCartStore.getState().reconcileOwner('user-a')
      useCartStore.getState().reconcileOwner(null)
      expect(useCartStore.getState().ownerId).toBeNull()
      expect(useCartStore.getState().items).toEqual([])
    })

    it('clears the cart when a different user logs in', () => {
      useCartStore.getState().addItem(product)
      useCartStore.getState().reconcileOwner('user-a')
      useCartStore.getState().reconcileOwner('user-b')
      expect(useCartStore.getState().ownerId).toBe('user-b')
      expect(useCartStore.getState().items).toEqual([])
    })

    it('is a no-op when the same user reloads', () => {
      useCartStore.getState().addItem(product)
      useCartStore.getState().reconcileOwner('user-a')
      useCartStore.getState().reconcileOwner('user-a')
      expect(useCartStore.getState().items).toHaveLength(1)
    })
  })
})
