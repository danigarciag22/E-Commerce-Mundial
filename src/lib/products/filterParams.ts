import { PRODUCT_CATEGORIES, type ProductCategory, type ProductFilters } from './types'

type RawParams = Record<string, string | string[] | undefined>

function num(v: string | string[] | undefined): number | undefined {
  if (typeof v !== 'string') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export function parseFilters(params: RawParams): ProductFilters {
  const filters: ProductFilters = {}
  const cat = params.category
  if (typeof cat === 'string' && (PRODUCT_CATEGORIES as readonly string[]).includes(cat)) {
    filters.category = cat as ProductCategory
  }
  const min = num(params.minPrice)
  const max = num(params.maxPrice)
  if (min !== undefined) filters.minPrice = min
  if (max !== undefined) filters.maxPrice = max
  return filters
}
