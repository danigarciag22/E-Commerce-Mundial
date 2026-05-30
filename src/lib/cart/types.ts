import type { ProductCategory } from '@/lib/products/types'

export type CartItem = {
  id: string
  name: string
  price: number
  category: ProductCategory
  quantity: number
}
