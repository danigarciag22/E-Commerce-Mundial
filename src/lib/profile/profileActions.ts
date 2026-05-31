'use server'

import { revalidatePath } from 'next/cache'
import { requireCrm } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'

export type ProfileState = { ok?: boolean; error?: string } | null

export async function updateProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireCrm()
  const fullName = String(formData.get('full_name') ?? '').trim() || null
  const supabase = await createClient()

  let avatarUrl: string | undefined
  const file = formData.get('avatar')
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith('image/')) return { error: 'El archivo debe ser una imagen' }
    if (file.size > 2 * 1024 * 1024) return { error: 'La imagen debe pesar menos de 2 MB' }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    const path = `${user.id}/avatar.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) return { error: 'No se pudo subir la imagen' }
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
    // cache-bust so the new image shows immediately
    avatarUrl = `${pub.publicUrl}?v=${Date.now()}`
  }

  const update: { full_name: string | null; avatar_url?: string } = { full_name: fullName }
  if (avatarUrl) update.avatar_url = avatarUrl
  const { error } = await supabase.from('app_users').update(update).eq('id', user.id)
  if (error) return { error: 'No se pudo guardar el perfil' }

  revalidatePath('/admin/perfil')
  revalidatePath('/admin', 'layout')
  return { ok: true }
}
