export type UserRole = 'admin' | 'customer'

export type Profile = {
  id: string
  email: string
  role: UserRole
}

export function isAdmin(profile: { role: string } | null): boolean {
  return profile?.role === 'admin'
}
