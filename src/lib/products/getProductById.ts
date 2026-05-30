import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { Product } from './types'

export async function getProductById(
  client: SupabaseClient<Database>,
  id: string,
): Promise<Product | null> {
  const { data, error } = await client.from('products').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    id: data.id,
    name: data.name,
    sku: data.sku,
    price: Number(data.price),
    description: data.description,
    category: data.category as Product['category'],
  }
}
