import { PRODUCT_CATEGORIES, type ProductCategory } from './types'

export type ProductInput = {
  name: string
  sku: string
  price: number
  category: ProductCategory
  description: string | null
  stock: number
  active: boolean
}

type RawInput = { name?: string; sku?: string; price?: string; category?: string; description?: string; stock?: string; active?: string }

export type ValidationResult =
  | { ok: true; data: ProductInput }
  | { ok: false; errors: Partial<Record<keyof RawInput, string>> }

export function validateProductInput(raw: RawInput): ValidationResult {
  const errors: Partial<Record<keyof RawInput, string>> = {}
  const name = (raw.name ?? '').trim()
  if (!name) errors.name = 'El nombre es obligatorio'
  const sku = (raw.sku ?? '').trim()
  if (!sku) errors.sku = 'El SKU es obligatorio'
  const priceNum = Number(raw.price)
  if (!raw.price || !Number.isFinite(priceNum) || priceNum < 0) {
    errors.price = 'El precio debe ser un número mayor o igual a 0'
  }
  const category = raw.category ?? ''
  if (!(PRODUCT_CATEGORIES as readonly string[]).includes(category)) {
    errors.category = 'Categoría inválida'
  }
  const stockRaw = raw.stock ?? ''
  const stock = stockRaw === '' ? 0 : Number(stockRaw)
  if (!Number.isInteger(stock) || stock < 0) {
    errors.stock = 'El stock debe ser un entero ≥ 0'
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors }
  const description = (raw.description ?? '').trim()
  return {
    ok: true,
    data: {
      name,
      sku,
      price: priceNum,
      category: category as ProductCategory,
      description: description === '' ? null : description,
      stock,
      active: raw.active === 'on' || raw.active === 'true',
    },
  }
}
