'use client'

import { useActionState } from 'react'
import { createCollectionAction, type CollectionFormState } from '@/lib/collections/collectionActions'

export function CollectionForm() {
  const [state, formAction, pending] = useActionState<CollectionFormState, FormData>(createCollectionAction, null)
  const field = 'rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-xs font-medium text-muted-foreground">Nombre</label>
        <input id="name" name="name" className={field} placeholder="Camisetas Mundial" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-xs font-medium text-muted-foreground">Descripción (opcional)</label>
        <textarea id="description" name="description" rows={2} className={field} placeholder="Selección destacada para el Mundial" />
      </div>
      <button type="submit" disabled={pending} className="w-fit rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
        {pending ? 'Creando…' : 'Crear colección'}
      </button>
      {state?.error && <span className="text-xs text-destructive">{state.error}</span>}
    </form>
  )
}
