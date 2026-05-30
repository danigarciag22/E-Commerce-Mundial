import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

export type Collection = { id: string; name: string; slug: string; description: string | null; productCount: number }

export async function getCollections(client: SupabaseClient<Database>): Promise<Collection[]> {
  const [colResult, pcResult] = await Promise.all([
    client.from('collections').select('id, name, slug, description').order('name'),
    client.from('product_collections').select('collection_id'),
  ])
  if (colResult.error) throw new Error(colResult.error.message)
  if (pcResult.error) throw new Error(pcResult.error.message)

  const countMap = new Map<string, number>()
  for (const row of pcResult.data ?? []) {
    countMap.set(row.collection_id, (countMap.get(row.collection_id) ?? 0) + 1)
  }

  return (colResult.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    productCount: countMap.get(c.id) ?? 0,
  }))
}

export async function getCollection(client: SupabaseClient<Database>, id: string) {
  const { data, error } = await client.from('collections').select('id, name, slug, description').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function getAssignedProductIds(client: SupabaseClient<Database>, collectionId: string): Promise<string[]> {
  const { data, error } = await client.from('product_collections').select('product_id').eq('collection_id', collectionId)
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => r.product_id)
}
