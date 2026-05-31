import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { UserRole } from '@/lib/auth/roles'

export type Member = { id: string; email: string; role: UserRole }

export async function getTeam(client: SupabaseClient<Database>): Promise<Member[]> {
  const { data, error } = await client.from('app_users').select('id, email, role').order('email')
  if (error) throw new Error(error.message)
  return (data ?? []).map((u) => ({ id: u.id, email: u.email, role: u.role as UserRole }))
}
