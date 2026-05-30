import { redirect } from 'next/navigation'
import { getUser, type AuthUser } from './getUser'
import { isAdmin } from './roles'

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
