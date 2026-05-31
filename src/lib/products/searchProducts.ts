import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { Product } from './types'
import { buildSearchOr } from './buildSearchOr'

export async function searchProducts(client: SupabaseClient<Database>, query: string): Promise<Product[]> {
  const or = buildSearchOr(query)
  if (!or) return []
  const { data, error } = await client
    .from('products')
    .select('*')
    .eq('active', true)
    .or(or)
    .order('name')
  if (error) throw new Error(error.message)
  return (data ?? []).map((p) => ({
    id: p.id, name: p.name, sku: p.sku, price: Number(p.price),
    description: p.description, category: p.category as Product['category'],
    stock: Number(p.stock), active: p.active,
  }))
}
