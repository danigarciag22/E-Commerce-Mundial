import { redirect } from 'next/navigation'
import { getUser, type AuthUser } from './getUser'
import { isAdmin } from './roles'
import { can, type Permission } from './permissions'

export async function requireUser(): Promise<AuthUser> {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await getUser()
  if (!user) redirect('/login')
  if (!isAdmin(user.profile)) redirect('/')
  return user
}

export async function requireCrm(): Promise<AuthUser> {
  const user = await getUser()
  if (!user) redirect('/login')
  if (!user.profile || user.profile.role === 'customer') redirect('/')
  return user
}

export async function requirePermission(permission: Permission): Promise<AuthUser> {
  const user = await requireCrm()
  if (!user.profile || !can(user.profile.role, permission)) redirect('/admin')
  return user
}
