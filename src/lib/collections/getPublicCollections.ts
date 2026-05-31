import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { Product } from '@/lib/products/types'

export type PublicCollection = { id: string; name: string; slug: string; description: string | null }

export async function getPublicCollections(client: SupabaseClient<Database>): Promise<PublicCollection[]> {
  const { data, error } = await client.from('collections').select('id, name, slug, description').order('name')
  if (error) throw new Error(error.message)
  return (data ?? []).map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description }))
}

export async function getCollectionBySlug(client: SupabaseClient<Database>, slug: string): Promise<PublicCollection | null> {
  const { data, error } = await client.from('collections').select('id, name, slug, description').eq('slug', slug).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? { id: data.id, name: data.name, slug: data.slug, description: data.description } : null
}

export async function getCollectionProducts(client: SupabaseClient<Database>, collectionId: string): Promise<Product[]> {
  const { data, error } = await client
    .from('product_collections')
    .select('products(*)')
    .eq('collection_id', collectionId)
  if (error) throw new Error(error.message)
  const rows = (data ?? [])
    .map((r) => (r as unknown as { products: Database['public']['Tables']['products']['Row'] | null }).products)
    .filter((p): p is Database['public']['Tables']['products']['Row'] => p != null)
    // only show active products in the storefront
    .filter((p) => p.active)
  return rows.map((p) => ({
    id: p.id, name: p.name, sku: p.sku, price: Number(p.price),
    description: p.description, category: p.category as Product['category'],
    stock: Number(p.stock), active: p.active,
  }))
}
