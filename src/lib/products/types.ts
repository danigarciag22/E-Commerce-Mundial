export const PRODUCT_CATEGORIES = ['uniforme', 'zapato', 'balon', 'merchandising'] as const
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]

export type Product = {
  id: string
  name: string
  sku: string
  price: number
  description: string | null
  category: ProductCategory
  stock: number
  active: boolean
}

export type ProductFilters = {
  category?: ProductCategory
  minPrice?: number
  maxPrice?: number
}
