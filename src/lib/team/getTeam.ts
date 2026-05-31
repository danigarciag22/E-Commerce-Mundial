import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { UserRole } from '@/lib/auth/roles'

export type Member = { id: string; email: string; role: UserRole; name: string | null; avatarUrl: string | null }

export async function getTeam(client: SupabaseClient<Database>): Promise<Member[]> {
  const { data, error } = await client.from('app_users').select('id, email, role, full_name, avatar_url').order('email')
  if (error) throw new Error(error.message)
  return (data ?? []).map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role as UserRole,
    name: u.full_name ?? null,
    avatarUrl: u.avatar_url ?? null,
  }))
}
