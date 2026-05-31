export type UserRole = 'admin' | 'manager' | 'staff' | 'viewer' | 'customer'

export type Profile = {
  id: string
  email: string
  role: UserRole
}

export function isAdmin(profile: { role: string } | null): boolean {
  return profile?.role === 'admin'
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  staff: 'Operador',
  viewer: 'Observador',
  customer: 'Cliente',
}

export const TEAM_ROLES: UserRole[] = ['admin', 'manager', 'staff', 'viewer']
