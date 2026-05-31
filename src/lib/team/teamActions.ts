'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { TEAM_ROLES, type UserRole } from '@/lib/auth/roles'

const ASSIGNABLE: UserRole[] = [...TEAM_ROLES, 'customer']

export async function updateMemberRoleAction(formData: FormData): Promise<void> {
  await requirePermission('manage_team')
  const id = String(formData.get('id') ?? '')
  const role = String(formData.get('role') ?? '') as UserRole
  if (!id || !ASSIGNABLE.includes(role)) return
  const supabase = await createClient()
  const { error } = await supabase.from('app_users').update({ role }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/equipo')
}
