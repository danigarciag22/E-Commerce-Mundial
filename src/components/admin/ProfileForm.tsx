'use client'

import { useActionState } from 'react'
import { updateProfileAction, type ProfileState } from '@/lib/profile/profileActions'

export function ProfileForm({ defaultName }: { defaultName: string | null }) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(updateProfileAction, null)
  const field =
    'rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="full_name" className="text-sm font-medium">Nombre completo</label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={defaultName ?? ''}
          placeholder="Tu nombre"
          className={field}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="avatar" className="text-sm font-medium">Foto de perfil</label>
        <input
          id="avatar"
          name="avatar"
          type="file"
          accept="image/*"
          className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="text-xs text-muted-foreground">JPG o PNG, máximo 2 MB.</p>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>
      )}
      {state?.ok && (
        <p role="status" className="text-sm font-medium text-primary">Perfil actualizado.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Guardando…' : 'Guardar perfil'}
      </button>
    </form>
  )
}
