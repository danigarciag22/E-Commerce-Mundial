'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { slugify } from './slugify'

export type CollectionFormState = { error?: string } | null

export async function createCollectionAction(_prev: CollectionFormState, formData: FormData): Promise<CollectionFormState> {
  await requireAdmin()
  const name = String(formData.get('name') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim() || null
  if (!name) return { error: 'El nombre es obligatorio' }
  const slug = slugify(name)
  const supabase = await createClient()
  const { error } = await supabase.from('collections').insert({ name, slug, description })
  if (error) return { error: 'No se pudo crear (¿nombre/slug duplicado?)' }
  revalidatePath('/admin/colecciones')
  return null
}

export async function deleteCollectionAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  const supabase = await createClient()
  await supabase.from('collections').delete().eq('id', id)
  revalidatePath('/admin/colecciones')
}

export async function setCollectionProductsAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const collectionId = String(formData.get('collection_id') ?? '')
  if (!collectionId) return
  const productIds = formData.getAll('product_id').map(String)
  const supabase = await createClient()
  // Replace the set: delete existing, insert selected.
  await supabase.from('product_collections').delete().eq('collection_id', collectionId)
  if (productIds.length > 0) {
    await supabase.from('product_collections').insert(productIds.map((pid) => ({ collection_id: collectionId, product_id: pid })))
  }
  revalidatePath('/admin/colecciones')
  revalidatePath(`/admin/colecciones/${collectionId}`)
}
