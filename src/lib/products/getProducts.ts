import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

export type Product = {
  id: string
  name: string
  sku: string
  price: number
  description: string | null
  category: string
}

export async function getProducts(
  client: SupabaseClient<Database>,
): Promise<Product[]> {
  const { data, error } = await client.from('products').select('*')
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    price: Number(row.price),
    description: row.description,
    category: row.category,
  }))
}
