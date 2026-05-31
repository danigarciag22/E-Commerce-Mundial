import { createClient } from '@/lib/supabase/server'
import type { Profile } from './roles'

export type AuthUser = {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  profile: Profile | null
}

export async function getUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('app_users')
    .select('id, email, role, full_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  return {
    id: user.id,
    email: user.email ?? '',
    name: profile?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    profile: profile
      ? { id: profile.id, email: profile.email, role: profile.role as Profile['role'] }
      : null,
  }
}
