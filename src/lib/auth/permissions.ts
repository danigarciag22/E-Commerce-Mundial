import type { UserRole } from './roles'

export type Permission =
  | 'view_dashboard' | 'manage_products' | 'manage_inventory'
  | 'manage_orders' | 'manage_discounts' | 'manage_collections' | 'manage_team'

const ALL: Permission[] = ['view_dashboard','manage_products','manage_inventory','manage_orders','manage_discounts','manage_collections','manage_team']

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ALL,
  manager: ['view_dashboard','manage_products','manage_inventory','manage_orders','manage_discounts','manage_collections'],
  staff: ['view_dashboard','manage_inventory','manage_orders'],
  viewer: ['view_dashboard'],
  customer: [],
}

export function can(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}
