import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { ProductInput } from './validateProductInput'

export async function createProduct(client: SupabaseClient<Database>, input: ProductInput): Promise<void> {
  const { error } = await client.from('products').insert(input)
  if (error) throw new Error(error.message)
}

export async function updateProduct(client: SupabaseClient<Database>, id: string, input: ProductInput): Promise<void> {
  const { error } = await client.from('products').update(input).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteProduct(client: SupabaseClient<Database>, id: string): Promise<void> {
  const { error } = await client.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
