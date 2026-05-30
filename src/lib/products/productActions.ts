'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/guards'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateProductInput } from './validateProductInput'
import { createProduct, updateProduct, deleteProduct } from './adminProducts'

export type ProductFormState = { errors?: Record<string, string>; error?: string } | null

function readForm(formData: FormData) {
  return {
    name: String(formData.get('name') ?? ''),
    sku: String(formData.get('sku') ?? ''),
    price: String(formData.get('price') ?? ''),
    category: String(formData.get('category') ?? ''),
    description: String(formData.get('description') ?? ''),
  }
}

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin()
  const result = validateProductInput(readForm(formData))
  if (!result.ok) return { errors: result.errors }
  try {
    await createProduct(createAdminClient(), result.data)
  } catch {
    return { error: 'No se pudo crear el producto (¿SKU duplicado?)' }
  }
  revalidatePath('/admin/productos')
  revalidatePath('/')
  redirect('/admin/productos')
}

export async function updateProductAction(
  id: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin()
  const result = validateProductInput(readForm(formData))
  if (!result.ok) return { errors: result.errors }
  try {
    await updateProduct(createAdminClient(), id, result.data)
  } catch {
    return { error: 'No se pudo actualizar el producto' }
  }
  revalidatePath('/admin/productos')
  revalidatePath(`/productos/${id}`)
  revalidatePath('/')
  redirect('/admin/productos')
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await deleteProduct(createAdminClient(), id)
  revalidatePath('/admin/productos')
  revalidatePath('/')
}
