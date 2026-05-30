'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { validateDiscount } from './validateDiscount'

export type DiscountFormState = { errors?: Record<string, string>; error?: string } | null

export async function createDiscountAction(_prev: DiscountFormState, formData: FormData): Promise<DiscountFormState> {
  await requireAdmin()
  const result = validateDiscount({
    code: String(formData.get('code') ?? ''),
    percent: String(formData.get('percent') ?? ''),
    expires_at: String(formData.get('expires_at') ?? ''),
  })
  if (!result.ok) return { errors: result.errors }
  const supabase = await createClient()
  const { error } = await supabase.from('discounts').insert(result.data)
  if (error) return { error: 'No se pudo crear (¿código duplicado?)' }
  revalidatePath('/admin/descuentos')
  return null
}

export async function toggleDiscountAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const active = String(formData.get('active') ?? '') === 'true'
  if (!id) return
  const supabase = await createClient()
  await supabase.from('discounts').update({ active }).eq('id', id)
  revalidatePath('/admin/descuentos')
}

export async function deleteDiscountAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  const supabase = await createClient()
  await supabase.from('discounts').delete().eq('id', id)
  revalidatePath('/admin/descuentos')
}
