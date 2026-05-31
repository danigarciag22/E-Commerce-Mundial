'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isPasswordValid } from '@/lib/auth/passwordRules'

export type AuthActionState = { error: string } | null

// Only redirect to in-app paths to avoid open-redirect via ?next=.
function safeNext(formData: FormData): string {
  const next = String(formData.get('next') ?? '')
  return next.startsWith('/') && !next.startsWith('//') ? next : '/'
}

export async function signIn(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const next = safeNext(formData)
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Correo o contraseña incorrectos' }
  revalidatePath('/', 'layout')
  redirect(next)
}

export async function signUp(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const fullName = String(formData.get('full_name') ?? '').trim()
  const next = safeNext(formData)

  if (!fullName) return { error: 'Ingresa tu nombre completo' }
  if (!isPasswordValid(password)) {
    return { error: 'La contraseña no cumple los requisitos mínimos' }
  }

  const supabase = await createClient()
  // full_name is stored in auth metadata immediately; it syncs to
  // app_users.full_name via the handle_new_user trigger (migration 0016).
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) return { error: 'No se pudo crear la cuenta. ¿Ya existe?' }
  revalidatePath('/', 'layout')
  redirect(next)
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
