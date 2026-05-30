'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { isValidStatus } from './orderStatus'

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!id || !isValidStatus(status)) return
  const supabase = await createClient()
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/ordenes')
  revalidatePath(`/admin/ordenes/${id}`)
  revalidatePath('/admin')
}
