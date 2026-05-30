import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { Product, ProductFilters } from './types'

export type { Product } from './types'

export async function getProducts(
  client: SupabaseClient<Database>,
  filters: ProductFilters = {},
): Promise<Product[]> {
  let query = client.from('products').select('*').order('created_at', { ascending: false })
  if (filters.category) query = query.eq('category', filters.category)
  if (filters.minPrice !== undefined) query = query.gte('price', filters.minPrice)
  if (filters.maxPrice !== undefined) query = query.lte('price', filters.maxPrice)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    price: Number(row.price),
    description: row.description,
    category: row.category as Product['category'],
    stock: Number(row.stock),
    active: row.active,
  }))
}
