import { createClient } from '@/lib/supabase/server'
import type { Profile } from './roles'

export type AuthUser = {
  id: string
  email: string
  profile: Profile | null
}

export async function getUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('app_users')
    .select('id, email, role')
    .eq('id', user.id)
    .maybeSingle()

  return {
    id: user.id,
    email: user.email ?? '',
    profile: profile
      ? { id: profile.id, email: profile.email, role: profile.role as Profile['role'] }
      : null,
  }
}
